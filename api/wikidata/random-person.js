import { findRandomWikipediaPerson } from '../_lib/randomWikipediaPerson.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const person = await findRandomWikipediaPerson();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(person);
  } catch (error) {
    res.status(503).json({
      code: 'WIKIPEDIA_DISCOVERY_UNAVAILABLE',
      error: 'Wikipedia could not choose a historical person just now.',
      technicalDetail: error instanceof Error ? error.message : 'Unknown Wikipedia discovery failure.',
      retryable: true,
      modelCalled: false,
    });
  }
}
