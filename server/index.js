const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const marked = require('marked');
require('dotenv').config();
const { OpenAI } = require('openai');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); 
app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({ dest: 'uploads/' });

app.post('/generate-meal-plan', async (req, res) => {
    try {
        const { ingredients, daysToPlan } = req.body;
        
        markdown='"```markdown"';
    
        const prompt = `You are a helpful meal planning assistant whose only task is to create a meal plan over ${daysToPlan} days using ingredients input by a user into
                        your text box. First, validate the input. If the request is inappropriate or does not involve meal preparation in any way, state "Error: Invalid Request". 
                        Using Markdown (DO NOT WRITE ${markdown}, DO NOT USE "####" HEADINGS (1, 2, 3 are fine)), create a realistic ${daysToPlan}-day meal plan using ONLY the following ingredients: ${ingredients}. List an estiamted calorie count after each 
                        meal (i.e. "Meal - 910 calories"). ONLY INCLUDE THE MEAL PLAN ITSELF, NO EXTRA COMMENTARY. ALL MEAL PLANS START WITH TITLE "### X-Day Meal Plan", then proceed to list
                        the days in format "### Day X" header, down one line, bullet "**Breakfast:** Meal - Calories", same for lunch and dinner, repeat for the other days.`;
    
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4o-mini",
        });
    
        const markdownContent = completion.choices[0].message.content;
        //const htmlContent = marked.parse(markdownContent);
    
        res.send(markdownContent);
    
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

app.post('/generate-meal-plan-from-image', upload.single('image'), async (req, res) => {
    try {
        const { daysToPlan } = req.body;
        const imagePath = req.file.path;

        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);

        // Use OpenAI's vision model to analyze the image
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What ingredients do you see in this image? List them concisely." },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
                            },
                        },
                    ],
                },
            ],
        });

        const ingredients = response.choices[0].message.content;

        // Generate meal plan using the identified ingredients
        const markdown='"```markdown"';
        const prompt = `You are a helpful meal planning assistant whose only task is to create a meal plan over ${daysToPlan} days using ingredients input by a user into
                        your text box. First, validate the input. If the request is inappropriate or does not involve meal preparation in any way, state "Error: Invalid Request". 
                        Using Markdown (DO NOT WRITE ${markdown}, DO NOT USE "####" HEADINGS (1, 2, 3 are fine)), create a realistic ${daysToPlan}-day meal plan using ONLY the following ingredients: ${ingredients}. List an estimated calorie count after each 
                        meal (i.e. "Meal - 910 calories"). ONLY INCLUDE THE MEAL PLAN ITSELF, NO EXTRA COMMENTARY. ALL MEAL PLANS START WITH TITLE "### X-Day Meal Plan", then proceed to list
                        the days in format "### Day X" header, down one line, bullet "**Breakfast:** Meal - Calories", same for lunch and dinner, repeat for the other days.`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-2024-05-13",
        });

        const markdownContent = completion.choices[0].message.content;

        // Delete the temporary image file
        fs.unlinkSync(imagePath);

        res.send(markdownContent);

    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while processing the image.");
    }
});

app.listen(port, '0.0.0.0', () => console.log(`Server listening on port ${port}`));