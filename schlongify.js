var dickWords = ["chode", "dick", "dong", "erect", "erection", "pecker", "penis", "prick", "schlong", "wang"];
var bigDickWords = ["Chode", "Dick", "Dong", "Erect", "Erection", "Pecker", "Penis", "Prick", "Schlong", "Wang"];
var biggerDickWords = ["CHODE", "DICK", "DONG", "ERECT", "ERECTION", "PECKER", "PENIS", "PRICK", "SCHLONG", "WANG"];

//Words we never want to replace on.
var whiteList = ["back", "band", "challenged", "checkout", "cock", "crap", "create", "damn", "december", "decision", "difficulties", "difficulty", "direct", "disambiguation", "don", "don't",
	"done", "existing", "fuck", "going", "indirect", "link", "many", "medieval", "official", "officially", "period", "prior", "private", "process", "pronunciation", "recent",
	"redirects" , "rock", "scheduling", "sends", "shit", "shone", "those", "unofficial", "verification"];

var wordsWeDontWant = ["erect", "wang"]; //Dick words we don't want automatically replaced
var DICK_VALUE = 3; //How close the word has to be to a dickWord.
var DICK_LENGTH = 4; //Minimum length of a word to affect. Don't change to less than 3 or 3 letters words with a and n become 'wang'
var LONG_VALUE = 1; //Adjusts how frequently "long" is replaced

$(document).ready(function() 
{
	walk(document.body);
});


function walk(node) 
{
	// I stole this function from here:
	// https://github.com/panicsteve/cloud-to-butt/blob/master/Source/content_script.js
	
	var child, next;

	switch (node.nodeType)  
	{
		case 1:  // Element
		case 9:  // Document
		case 11: // Document fragment
			child = node.firstChild;
			while(child) 
			{
				next = child.nextSibling;
				walk(child);
				child = next;
			}
			break;

		case 3: // Text node
			schlongify(node);
			node.normalize();
			break;
	}
}

//Returns true if a character is uppercase,
//Returns false otherwise.
function isUpperCase(character)
{
	if(character == character.toLowerCase())
	{
		return false;
	}
	if(character == character.toUpperCase()) 
	{
		return true;
	}
	return false;
}

//Returns true if an object exists in an array
//a is the array, obj is the element.
function contains(a, obj) 
{
    for(var i = 0; i < a.length; ++i) 
	{
        if(a[i] === obj) 
		{
            return true;
        }
    }
    return false;
}

//If an element contains text, replace it appropriately. Or inappropriately, as the case may be.
//This replaces whole words.
//Examples: Venus->Penis, Long->Schlong
function schlongify(textNode) 
{
	var searchWords;
	var v = textNode.nodeValue;
	var res = v.match(/[a-zA-Z0-9]+/g); //Match alphanumeric
	
	if(res)
	{
		//Each word in the document
		for(var i = 0; i < res.length; ++i)
		{
			var word = res[i];
			
			if(contains(whiteList, word.toLowerCase()))
			{
				continue;
			}
			
			//Handle upper or lower case
			if(isUpperCase(word[0]))
			{
				if(isUpperCase(word[word.length-1])) //If the first and last letter are capitalzied, assume the whole word is.
				{
					searchWords = biggerDickWords;
				}
				else
				{
					searchWords = bigDickWords;
				}
			}
			else
			{
				searchWords = dickWords;
			}
		
			if(word.length > 5 && new Levenshtein(word.toLowerCase(), "erection") > DICK_VALUE)
			{
				v = replacePartial(v, word, searchWords);//This breaks google. 
			}
			else
			{
				v = replace(v, word, searchWords);
			}
		}
	}	
	
	textNode.nodeValue = v;
	textNode.normalize();
}

//Replaces words that are contained in other words.
//Examples: electoral->erectoral, Venusaur->Penisaur
function replacePartial(v, word, searchWords)
{	
	var min = Number.MAX_VALUE; //Populate with garbage
	var minIndex = Number.MAX_VALUE; //The best replacement word
	
	var bestStartIndex; //Start index of the current best subword
	var bestLength; //Length of the best replacement
	
	var bestSubstring; //Best substring to replace
	
	//Iterate through the first n-5 characters of the word
	for(var startIndex = 0; startIndex < word.length - 5; ++startIndex)
	{
		//Check the 4 character substring first
		var substring = word.substr(startIndex, 4);
		//Check each dick word
		for(var i = 0; i < searchWords.length; ++i)
		{
			var l = new Levenshtein(substring.toLowerCase(), searchWords[i].toLowerCase());
			if(l.distance < min || (l.distance == min && Math.random() * 2 == 0)) //Add some randomness to the selection
			{
				min = l.distance;
				minIndex = i;
				bestStartIndex = startIndex;
				bestLength = 4;
				bestSubstring = substring;
			}
		}
		
		//Check the 5 character substring first
		var substring = word.substr(startIndex, 5);

		//Check each dick word
		for(var i = 0; i < searchWords.length; ++i)
		{
			var l = new Levenshtein(substring.toLowerCase(), searchWords[i].toLowerCase());
			if(l.distance < min || (l.distance == min && Math.random() * 2 == 0)) //Add some randomness to the selection
			{
				min = l.distance;
				minIndex = i;
				bestStartIndex = startIndex;
				bestLength = 5;
				bestSubstring = substring;
			}
		}
	}
	
	//Perform the replacement
	var replacement;
	
	if(min < DICK_VALUE && bestSubstring != null)
	{		
		if(isUpperCase(bestSubstring[0]))
		{
			searchWords = bigDickWords;
		}
		else
		{
			searchWords = dickWords;
		}
		
		//Special cases
		//Long as a name should never be Dong.
		if(word == "Long")
		{
			replacement = word.replace(bestSubstring, "Schlong");
		}
		else if(word == "electric")
		{
			replacement = "erectric";
		}
		else if(bestSubstring == "wand" || bestSubstring == "wing" || (bestSubstring == "hang" && word.toLowerCase() != "changes") || bestSubstring == "bang" || bestSubstring == "wane")
		{
			replacement = word.replace(bestSubstring, "wang");
		}
		else if(!contains(wordsWeDontWant, searchWords[minIndex]))
		{	
			replacement = word.replace(bestSubstring, searchWords[minIndex]);
		}
		else
		{
			replacement = word; //To avoid any undefined's
		}
		
		v = v.replace(word, replacement);
	}
	
	return v;
}

//Replace a full word
function replace(v, word, searchWords)
{
	var min = Number.MAX_VALUE; //Populate with garbage.
	var minIndex = Number.MAX_VALUE; //The best replacement term
	
	//Check how close each dick word is to the original word
	for(var j = 0; j < searchWords.length; ++j)
	{
		var l = new Levenshtein(word.toLowerCase(), searchWords[j].toLowerCase());
		if(l.distance < min || (l.distance == min && Math.random() * 2 == 0)) //Add some randomness to the selection
		{
			min = l.distance;
			minIndex = j;
		}
	}			
	
	//Now that we've iterated through everything, make the best replacement.
	if(min < DICK_VALUE && word.length >= DICK_LENGTH)
	{		
		//Special cases
		//Long as a name should never be Dong.
		if(word == "Long")
		{
			v = v.replace(word, "Schlong");
		}
		else if(word == "electoral")
		{
			replacement = "erectoral";
		}
		else if(word == "elect")
		{
				replacement = "erect";
		}
		else if(word == "electric")
		{
			replacement = "erectric";
		}
		else if(word == "long" && Math.random() * LONG_VALUE == 0)
		{
			//Do nothing
		}
		else if(word == "wand" || word == "wing" || word == "hang" || word == "bang" || word == "wane")
		{
			v = v.replace(word, "wang");
		}
		else if(!contains(wordsWeDontWant, searchWords[minIndex]))
		{	
			v = v.replace(word, searchWords[minIndex]);
		}
	}	
	return v;
}