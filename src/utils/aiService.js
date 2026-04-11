 const OpenAI = require('openai');
const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});
class AIService {
// Generate category overview
static async generateCategoryOverview(category, agencies) {
try {
const prompt = `You are an expert in the Indian business and agency landscape. 
Generate a brief, informative overview (2-3 sentences) about ${category.name} in India.
Context:- Category: ${category.name}- Number of agencies: ${agencies.length}- Sample agencies: ${agencies.slice(0, 5).map(a => a.name).join(', ')}
Focus on:
1. What these agencies typically do
2. Current trends in India
3. Why businesses hire them
Keep it professional, concise, and India-specific.`;
const completion = await openai.chat.completions.create({
model: 'gpt-3.5-turbo',
messages: [{ role: 'user', content: prompt }],
max_tokens: 150,
temperature: 0.7
});
return completion.choices[0].message.content.trim();
} catch (error) {
console.error('AI generation error:', error);
return null;
}
}
// Generate location overview
static async generateLocationOverview(state, cities, agencies) {
try {
const prompt = `You are an expert in India's business landscape.
Generate a brief overview (2-3 sentences) about the agency ecosystem in ${state.name}, India.
Context:- State: ${state.name}- Number of cities: ${cities.length}- Major cities: ${cities.slice(0, 3).map(c => c.name).join(', ')}- Number of agencies: ${agencies.length}
Focus on:
1. The business environment in this state
2. Major cities for agencies
3. Types of agencies popular here
Keep it professional and India-specific.`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      });
      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI generation error:', error);
      return null;
    }
  }
}
module.exports = AIService;