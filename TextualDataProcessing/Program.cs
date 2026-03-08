using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

class Program
{
    static void Main()
    {
        // Prompt user to enter a paragraph
        Console.WriteLine("Enter a paragraph of text:");
        string paragraph = Console.ReadLine(); 

        // Count vowels (case insensitive by converting to lowercase)
        int vowelCount = paragraph.ToLower().Count(c => "aeiou".Contains(c));

        // Remove all punctuation except # and / using regex
        string cleanedText = Regex.Replace(paragraph, @"[^\w\s#/]", "");

        // Split cleaned text into words by spaces
        string[] rawWords = cleanedText.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

        // Initialize list to hold final words
        List<string> words = new List<string>();

        // Handle compound words like "his/her" by splitting on '/'
        foreach (string word in rawWords)
        {
            if (word.Contains("/"))
                words.AddRange(word.Split('/')); // Split and add both parts
            else
                words.Add(word); // Add word as-is
        }

        // Count total number of words
        int wordCount = words.Count;

        // Create dictionary to store word frequencies (case-insensitive)
        Dictionary<string, int> frequency = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        // Populate frequency dictionary
        foreach (string word in words)
        {
            if (frequency.ContainsKey(word))
                frequency[word]++; // Increment count if word exists
            else
                frequency[word] = 1; // Initialize count if new word
        }

        // Sort dictionary alphabetically by word
        var sorted = frequency.OrderBy(kvp => kvp.Key);

        // Determine column widths for clean output formatting
        int maxWordLength = sorted.Max(kvp => kvp.Key.Length); // Longest word
        int countColumnWidth = sorted.Max(kvp => kvp.Value.ToString().Length); // Largest count

        // Display total word and vowel counts
        Console.WriteLine($"Word Count: {wordCount}");
        Console.WriteLine($"Vowel Count: {vowelCount}");

        // Display header for frequency table
        Console.WriteLine("Word Frequency count:");
        Console.WriteLine("       WordFrequency");

        // Display each word and its frequency, right-aligned
        foreach (var kvp in sorted)
        {
            Console.WriteLine($"{kvp.Key.PadLeft(maxWordLength)}      {kvp.Value.ToString().PadLeft(countColumnWidth)}");
        }
    }
}