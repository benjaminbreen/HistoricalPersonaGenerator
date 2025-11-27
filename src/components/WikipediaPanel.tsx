import React, { useState, useEffect } from 'react';
import './WikipediaPanel.css';

interface WikipediaContent {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  url: string;
}

interface WikipediaPanelProps {
  articleTitle: string | null;
  onClose: () => void;
}

export const WikipediaPanel: React.FC<WikipediaPanelProps> = ({ articleTitle, onClose }) => {
  const [content, setContent] = useState<WikipediaContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleTitle) {
      setContent(null);
      return;
    }

    const fetchWikipediaContent = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use Wikipedia API with TextExtracts to get more content (3-4 paragraphs)
        const params = new URLSearchParams({
          action: 'query',
          format: 'json',
          prop: 'extracts|pageimages',
          explaintext: '1', // Plain text format
          exsectionformat: 'plain',
          exchars: '2500', // Get ~2500 characters (approximately 4-6 paragraphs)
          piprop: 'thumbnail',
          pithumbsize: '400',
          titles: articleTitle,
          redirects: '1',
          origin: '*'
        });

        const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Article not found');
        }

        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pageId === '-1') {
          throw new Error('Article not found');
        }

        const page = pages[pageId];

        console.log('[WikipediaPanel] Fetched content length:', page.extract?.length || 0, 'characters');
        console.log('[WikipediaPanel] Content preview:', page.extract?.substring(0, 200));

        setContent({
          title: page.title,
          extract: page.extract || 'No content available',
          thumbnail: page.thumbnail ? {
            source: page.thumbnail.source,
            width: page.thumbnail.width,
            height: page.thumbnail.height
          } : undefined,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchWikipediaContent();
  }, [articleTitle]);

  if (!articleTitle) {
    return null;
  }

  return (
    <>
      <div className="wikipedia-overlay" onClick={onClose} />
      <div className="wikipedia-panel">
        <div className="wikipedia-panel-header">
          <h2>Wikipedia</h2>
          <button className="wikipedia-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="wikipedia-panel-content">
          {loading && (
            <div className="wikipedia-loading">
              <div className="loading-spinner"></div>
              <p>Loading article...</p>
            </div>
          )}

          {error && (
            <div className="wikipedia-error">
              <p>Error: {error}</p>
            </div>
          )}

          {content && !loading && (
            <>
              <h3>{content.title}</h3>

              {content.thumbnail && (
                <img
                  src={content.thumbnail.source}
                  alt={content.title}
                  className="wikipedia-thumbnail"
                />
              )}

              <div className="wikipedia-extract">
                {(() => {
                  const paragraphs = content.extract.split('\n').filter(p => p.trim());
                  console.log('[WikipediaPanel] Number of paragraphs:', paragraphs.length);
                  console.log('[WikipediaPanel] Paragraph lengths:', paragraphs.map(p => p.length));
                  return paragraphs.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ));
                })()}
              </div>

              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="wikipedia-read-more"
              >
                Read more on Wikipedia →
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
};
