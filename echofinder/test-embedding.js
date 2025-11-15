import axios from 'axios';

async function test() {
  try {
    console.log('🧪 Testing embedding service...\n');

    const response = await axios.post('http://localhost:8001/compare', {
      new_text: 'The payment button is greyed out',
      old_texts: [
        'Cannot checkout with PayPal button disabled',
        'Credit card payment failing',
        'Profile page not loading'
      ]
    });

    console.log('✅ Embedding service working!\n');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

test();