document.addEventListener('DOMContentLoaded', () => {
    const cookBtn = document.getElementById('cook-btn');
    const apiKeyInput = document.getElementById('api-key');
    const ingredientsInputs = [
        document.getElementById('ing-1'),
        document.getElementById('ing-2'),
        document.getElementById('ing-3')
    ];
    
    const resultCard = document.getElementById('recipe-card');
    const recipeContent = document.getElementById('recipe-content');
    const loadingScreen = document.getElementById('loading');

    // Retrieve API key from local storage if previously saved
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }

    cookBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        
        const ingredients = ingredientsInputs
            .map(input => input.value.trim())
            .filter(val => val.length > 0);

        if (!apiKey) {
            alert("Please enter your Gemini API key to use the app.");
            apiKeyInput.focus();
            return;
        }

        if (ingredients.length === 0) {
            alert("Please enter at least one ingredient!");
            ingredientsInputs[0].focus();
            return;
        }

        // Save key for future convenience
        localStorage.setItem('gemini_api_key', apiKey);

        // Update UI
        resultCard.classList.add('hidden');
        loadingScreen.classList.remove('hidden');
        cookBtn.disabled = true;
        cookBtn.style.opacity = '0.7';

        try {
            const prompt = `You are a creative, enthusiastic master chef. 
I have the following ingredients: ${ingredients.join(", ")}.
Please create a delicious, easy-to-follow recipe using these ingredients. 
You may assume I have basic pantry staples like oil, butter, salt, pepper, garlic, and water.

Please include:
1. A creative, catchy title for the recipe
2. Prep time and Cook time
3. A complete list of ingredients (including the ones I provided and standard pantry staples)
4. Step-by-step instructions
5. A short pro-tip for making it extra tasty!

Format the entire response beautifully using Markdown.`;

            // Call the Gemini API directly using native fetch. 
            // This is required since modern JavaScript modules don't work natively on 'file://' paths.
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Failed to generate recipe');
            }

            const result = await response.json();
            const responseText = result.candidates[0].content.parts[0].text;

            // Convert markdown to HTML using the global marked object that we included in index.html
            recipeContent.innerHTML = marked.parse(responseText);
            
            // Show result
            loadingScreen.classList.add('hidden');
            resultCard.classList.remove('hidden');
            
            // Smooth scroll to the result
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error(error);
            loadingScreen.classList.add('hidden');
            alert(`Oops! Failed to generate recipe.\n\nMake sure your API key is valid.\n\nError details: ${error.message}`);
        } finally {
            cookBtn.disabled = false;
            cookBtn.style.opacity = '1';
        }
    });
});
