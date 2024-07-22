import React, { useState } from 'react';
import './App.css';
import { jsPDF } from "jspdf";
import DOMPurify from 'dompurify';
import styled from 'styled-components';
import { marked } from 'marked';
import img1 from "./feature-img.png";
import img2 from "./Chef_icon.svg.png";
import img3 from "./splash.png";

const HomePage = ({ onGetStarted }) => (
  <div className="min-h-screen bg-blue-900 text-white p-8 flex flex-col">
    <div className="container mx-auto flex-grow">
      <h1 className="text-4xl font-bold mb-4">Gourmet Guide 🧑‍🍳</h1>
      <div className="mb-8">
        <p className="mb-2">Get a fully personalized 3-meal per day plan for as many days as you'd like!</p>
        <p className="mb-2">Go from ingredients to delicacies in seconds!</p>
        <p className="mb-2">Use any food you have laying around!</p>
        <p className="mb-2">Spend less time stressing about meal prep!</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <img src={img1} style={{ width: 250, height: 250 }} alt="Food Picture 1" />
        <img src={img2} style={{ width: 250, height: 250 }} alt="Food Picture 2" />
        <img src={img3} style={{ width: 250, height: 250 }} alt="Food Picture 3" />
      </div>
      <button
        onClick={onGetStarted}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Get Started
      </button>
    </div>
    <footer style={{ textAlign: 'center', marginTop: '20px' }}>
      &copy; 2024 Drew Reisner
    </footer>
  </div>
);


const MealPlanContent = styled.div`
  h2 {
    font-size: 1.5em;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
  }
  h3 {
    font-size: 1.3em;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
  }
  p {
    margin-bottom: 0.5em;
  }
  ul {
    list-style-type: disc;
    padding-left: 1.5em;
    margin-bottom: 1em;
  }
  li {
    margin-bottom: 0.25em;
  }
  strong {
    font-weight: bold;
  }
`;

const MainScreen = ({ onGourmetGuideClick }) => {
  const [ingredients, setIngredients] = useState('');
  const [mealPlan, setMealPlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [daysToPlan, setDaysToPlan] = useState(7);

  const generateMealPlan = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('https://gourmetguide.adaptable.app/generate-meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ingredients: ingredients, 
          daysToPlan: daysToPlan,
        }),
      });
  
      const data = await response.text();
      //console.log(data);
      //console.log(marked(data));
      setMealPlan(marked(data));
    } catch (error) {
      console.error('Error fetching meal plan:', error);
      setMealPlan('Error 217: Error processing request');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    const pdf = new jsPDF();
    const parser = new DOMParser();
    const doc = parser.parseFromString(mealPlan, 'text/html');
    
    let y = 15;
    const margin = 15;
    const pageWidth = pdf.internal.pageSize.width;
    const maxWidth = pageWidth - 2 * margin;
  
    const addTextWithWrapping = (text, fontSize, isBold = false, indent = 0) => {
      pdf.setFontSize(fontSize);
      pdf.setFont(undefined, isBold ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(text, maxWidth - indent);
      lines.forEach(line => {
        if (y > 280) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(margin + indent, y, line);
        y += fontSize * 0.7;
      });
      y += fontSize * 0.0001;
    };
  
    // Add title
    const title = doc.querySelector('h2') ? doc.querySelector('h2').textContent : 'Gourmet Guide Meal Plan';
    addTextWithWrapping(title, 18, true);
  
    Array.from(doc.body.children).forEach(element => {
      if (element.tagName === 'H3' && element.textContent.startsWith('Day')) {
        // Day header
        y += 5;
        addTextWithWrapping(element.textContent, 14, true);
      } else if (element.tagName === 'UL') {
        Array.from(element.children).forEach(li => {
          const [mealType, mealDescription] = li.textContent.split(':');
          addTextWithWrapping(mealType + ':', 12, true, 5);
          addTextWithWrapping(mealDescription.trim(), 12, false, 10);
        });
      } else if (element.tagName === 'P') {
        addTextWithWrapping(element.textContent, 12, false);
      }
    });
  
    pdf.save('meal_plan.pdf');
  };  

  const refreshPage = () => {
    setIngredients('');
    setMealPlan('');
  };

  return (
    <div className="min-h-screen bg-blue-900 text-white p-8 flex flex-col">
      <div className="container mx-auto flex-grow">
      <div className="container mx-auto">
        <h1
          onClick={onGourmetGuideClick}
          className="text-4xl font-bold mb-8 cursor-pointer"
        >
          Gourmet Guide 🧑‍🍳
        </h1>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Ingredients</h2>
            <h3 className="text-2x1 mb-7">Type your ingredients in below in any format! Only these ingredients will be used in creating the meal plan.</h3>
            <textarea
              className="w-full h-40 p-2 text-black rounded"
              placeholder="Ingredients list"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />
  
            <div className="mt-4">
              <label
                htmlFor="days"
                className="block text-sm font-medium text-gray-400"
              >
                # of Days to Plan:
              </label>
              <input
                type="number"
                id="days"
                className="mt-1 p-2 w-full rounded border border-gray-700 bg-gray-800 text-white"
                min="1"
                value={daysToPlan}
                onChange={(e) => setDaysToPlan(parseInt(e.target.value, 10))}
              />
            </div>
  
            <button
              onClick={generateMealPlan}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              disabled={isGenerating}
            >
              {isGenerating ? 'Working...' : 'Create Meal Plan'}
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">Meal Plan</h2>
            <MealPlanContent className={`bg-white text-black p-4 rounded h-80 overflow-auto ${!mealPlan ? 'MealPlanPlaceholder' : ''}`}>
              {mealPlan ? (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mealPlan) }} />
              ) : (
                <span style={{ color: 'gray' }}>Your meal plan will appear here. Click "Create Meal Plan" below!</span>
              )}
            </MealPlanContent>
            <h3 className="text-2x1 mt-4">Note: Calorie count may be inaccurate.</h3>
            {mealPlan && (
              <div className="mt-4">
                <p className="mb-5">
                  Your meal plan is ready! You can now download it as a PDF.
                </p>
                <button
                  onClick={downloadPDF}
                  className="bg-green-500 hover:bg-green-600 mb-7 text-white font-bold py-2 px-4 rounded"
                >
                  Download as PDF
                </button>
              </div>
            )}
            {mealPlan && (
              <button
                onClick={refreshPage}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                  Create New Plan
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
      <footer style={{ textAlign: 'center', marginTop: '20px' }}>
        &copy; 2024 Drew Reisner
      </footer>
    </div>
  );
};

const App = () => {
  const [showMainScreen, setShowMainScreen] = useState(false);

  const navigateToHome = () => {
    setShowMainScreen(false);
  };

  return (
    <div>
      {showMainScreen ? (
        <MainScreen onGourmetGuideClick={navigateToHome} />
      ) : (
        <HomePage onGetStarted={() => setShowMainScreen(true)} />
      )}
    </div>
  );
};

export default App;