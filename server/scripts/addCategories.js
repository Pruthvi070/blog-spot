const mongoose = require('mongoose');
const PostCategory = require('../model/PostCategory');
require('dotenv').config();

const categories = [
  {
    name: "Travel",
    icon: "✈️",
    desc: "Travel experiences, destinations, and tips"
  },
  {
    name: "Food",
    icon: "🍽️",
    desc: "Recipes, restaurant reviews, and culinary adventures"
  },
  {
    name: "Lifestyle",
    icon: "🌟",
    desc: "Personal lifestyle, wellness, and daily living"
  },
  {
    name: "Technology",
    icon: "💻",
    desc: "Tech news, reviews, and tutorials"
  },
  {
    name: "Education",
    icon: "📚",
    desc: "Learning resources, educational content, and study tips"
  },
  {
    name: "Fashion & Beauty",
    icon: "👗",
    desc: "Fashion trends, beauty tips, and style guides"
  },
  {
    name: "Finance",
    icon: "💰",
    desc: "Financial advice, investment tips, and money management"
  },
  {
    name: "Business & Startups",
    icon: "💼",
    desc: "Business insights, startup stories, and entrepreneurship"
  },
  {
    name: "Entertainment",
    icon: "🎬",
    desc: "Movies, music, games, and entertainment news"
  },
  {
    name: "Environment & Nature",
    icon: "🌍",
    desc: "Environmental issues, nature, and sustainability"
  },
  {
    name: "News & Current Affairs",
    icon: "📰",
    desc: "Latest news and current events"
  },
  {
    name: "Personal Blog",
    icon: "✍️",
    desc: "Personal thoughts, experiences, and stories"
  }
];

const MONGODB_URI = process.env.MONGO_URL;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Clear existing categories
      await PostCategory.deleteMany({});
      console.log('Cleared existing categories');
      
      // Add new categories
      const result = await PostCategory.insertMany(categories);
      console.log('Added categories:', result);
      
      console.log('Categories added successfully!');
    } catch (error) {
      console.error('Error adding categories:', error);
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  }); 