/**
 * Bad Words Filter
 * Filters profanity and inappropriate content from user-generated text
 */

// Default bad words list (extend as needed)
const DEFAULT_BAD_WORDS = [
    'badword1', 'badword2', 'profanity', 'offensive',
    // Add more based on your needs and language
];

// Get bad words from environment or use default
const getBadWordsList = () => {
    const envWords = process.env.BAD_WORDS_LIST;
    if (envWords) {
        return envWords.split(',').map(w => w.trim().toLowerCase());
    }
    return DEFAULT_BAD_WORDS;
};

/**
 * Check if text contains bad words
 * @param {string} text - Text to check
 * @returns {Object} { hasBadWords: boolean, foundWords: string[] }
 */
export function checkBadWords(text) {
    if (!text) return { hasBadWords: false, foundWords: [] };

    const badWords = getBadWordsList();
    const lowerText = text.toLowerCase();
    const foundWords = [];

    for (const word of badWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(lowerText)) {
            foundWords.push(word);
        }
    }

    return {
        hasBadWords: foundWords.length > 0,
        foundWords,
    };
}

/**
 * Filter bad words from text (replace with asterisks)
 * @param {string} text - Text to filter
 * @returns {string} Filtered text
 */
export function filterBadWords(text) {
    if (!text) return text;

    const badWords = getBadWordsList();
    let filtered = text;

    for (const word of badWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const replacement = '*'.repeat(word.length);
        filtered = filtered.replace(regex, replacement);
    }

    return filtered;
}

/**
 * Validate comment text
 * @param {string} text - Comment text
 * @returns {Object} { valid: boolean, reason?: string, filtered?: string }
 */
export function validateCommentText(text) {
    if (!text || text.trim().length === 0) {
        return { valid: false, reason: 'Comment cannot be empty' };
    }

    if (text.length > 1000) {
        return { valid: false, reason: 'Comment too long (max 1000 characters)' };
    }

    const { hasBadWords, foundWords } = checkBadWords(text);

    if (hasBadWords) {
        // Option 1: Reject entirely
        if (process.env.BAD_WORDS_ACTION === 'reject') {
            return {
                valid: false,
                reason: `Comment contains inappropriate language: ${foundWords.join(', ')}`,
            };
        }

        // Option 2: Flag for moderation
        if (process.env.BAD_WORDS_ACTION === 'moderate') {
            return {
                valid: true,
                requiresModeration: true,
                reason: 'Comment flagged for moderation',
                filtered: filterBadWords(text),
            };
        }

        // Option 3: Auto-filter (default)
        return {
            valid: true,
            filtered: filterBadWords(text),
        };
    }

    return { valid: true };
}
