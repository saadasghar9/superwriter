jQuery(document).ready(function($) {
    function showResponse(message, type) {
        const $response = $('#super-writer-response');
        $response.removeClass('success error loading').addClass(type).html(message);

        // Reinitialize tab functionality after loading new content
        $('.sw-tab-item').click(function() {
            const tab = $(this).data('tab');
            $('.sw-tab-item').removeClass('active');
            $(this).addClass('active');
            $('.sw-tab-panel').removeClass('active');
            $('#' + tab + '-panel').addClass('active');
        });

        // Set the first tab as active by default
        $('.sw-tab-item:first').trigger('click');
    }

    function getSentimentLabel(score, magnitude) {
        let scoreLabel, scoreClass = '';
        if (score >= 0.5) {
            scoreLabel = "Highly Positive";
            scoreClass = 'sentiment-high-positive';
        } else if (score > 0) {
            scoreLabel = "Positive";
        } else if (score <= -0.5) {
            scoreLabel = "Highly Negative";
            scoreClass = 'sentiment-high-negative';
        } else if (score < 0) {
            scoreLabel = "Negative";
        } else {
            scoreLabel = "Neutral";
        }

        let magnitudeLabel = magnitude >= 0.7 ? "Very Subjective" : magnitude > 0.3 ? "Moderately Subjective" : "Objective";
        let magnitudeClass = magnitude >= 0.7 ? 'sentiment-very-subjective' : '';

        return `<span class="${scoreClass}">${scoreLabel} (Score: ${score.toFixed(2)})</span> / <span class="${magnitudeClass}">${magnitudeLabel} (Magnitude: ${magnitude.toFixed(2)})</span>`;
    }

    $('#submit_text').click(function() {
        const text = $('#user_text').val().trim();
        if (!text) {
            showResponse('Please enter some text.', 'error');
            return;
        }

        showResponse('Processing...', 'loading');
        $.ajax({
            url: 'https://web-production-162b.up.railway.app/api/receive-text/', // Adjust to your Django domain (e.g., PythonAnywhere)
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ text: text }),
            success: function(response) {
                if (response.status === 'success') {
                    const data = response;
                    const sentiment = data.analysis.sentiment;
                    const sentimentDisplay = getSentimentLabel(sentiment.score, sentiment.magnitude);
                    const entitiesHtml = data.analysis.entities.map(e => `<li>${e.text} (${e.label})</li>`).join('');
                    const keyPhrases = data.analysis.top_words.join(', ');

                    // Fetch the visualization HTML
                    $.get(data.visualization_url, function(visualizationHtml) {
                        showResponse(`
                            <div class="sw-tabs">
                                <ul class="sw-tab-nav">
                                    <li class="sw-tab-item" data-tab="entities">Entities</li>
                                    <li class="sw-tab-item" data-tab="key-phrases">Key Phrases</li>
                                    <li class="sw-tab-item" data-tab="language">Language</li>
                                    <li class="sw-tab-item" data-tab="pii">PII</li>
                                    <li class="sw-tab-item" data-tab="sentiment">Sentiment</li>
                                </ul>
                                <div class="sw-tab-content">
                                    <div class="sw-tab-panel" id="entities-panel">
                                        <div class="sw-entity-visualization">${visualizationHtml}</div>
                                    </div>
                                    <div class="sw-tab-panel" id="key-phrases-panel">
                                        <div id="key-phrases-content">Key Phrases: ${keyPhrases}</div>
                                    </div>
                                    <div class="sw-tab-panel" id="language-panel">
                                        <div id="language-content">Language: English (assuming English for now)</div>
                                    </div>
                                    <div class="sw-tab-panel" id="pii-panel">
                                        <div id="pii-content">No PII detected (implement PII detection if needed)</div>
                                    </div>
                                    <div class="sw-tab-panel" id="sentiment-panel">
                                        <div id="sentiment-content">Sentiment: ${sentimentDisplay}</div>
                                    </div>
                                </div>
                            </div>
                        `, 'success');
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        console.error('Visualization fetch failed:', {
                            url: data.visualization_url,
                            status: textStatus,
                            error: errorThrown,
                            response: jqXHR.responseText
                        });
                        showResponse('Failed to load entity visualization. Check console for details.', 'error');
                    });
                } else {
                    showResponse(response.message || 'An error occurred.', 'error');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Text submission failed:', textStatus, errorThrown);
                showResponse('An error occurred while processing your request.', 'error');
            }
        });
    });

    $('#submit_url').click(function() {
        const url = $('#user_url').val().trim();
        if (!url) {
            showResponse('Please enter a URL.', 'error');
            return;
        }

        showResponse('Processing...', 'loading');
        $.ajax({
            url: 'https://web-production-162b.up.railway.app/api/fetch-text/', // Adjust to your Django domain
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ url: url }),
            success: function(response) {
                if (response.status === 'success') {
                    const data = response;
                    const sentiment = data.analysis.sentiment;
                    const sentimentDisplay = getSentimentLabel(sentiment.score, sentiment.magnitude);
                    const entitiesHtml = data.analysis.entities.map(e => `<li>${e.text} (${e.label})</li>`).join('');
                    const keyPhrases = data.analysis.top_words.join(', ');

                    // Use POST to fetch visualization
                    $.ajax({
                        url: 'https://web-production-162b.up.railway.app/api/visualize/', // Adjust to your Django domain
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ text: data.extracted_text }),
                        success: function(visualizationHtml) {
                            showResponse(`
                                <div class="sw-tabs">
                                    <ul class="sw-tab-nav">
                                        <li class="sw-tab-item" data-tab="entities">Entities</li>
                                        <li class="sw-tab-item" data-tab="key-phrases">Key Phrases</li>
                                        <li class="sw-tab-item" data-tab="language">Language</li>
                                        <li class="sw-tab-item" data-tab="pii">PII</li>
                                        <li class="sw-tab-item" data-tab="sentiment">Sentiment</li>
                                    </ul>
                                    <div class="sw-tab-content">
                                        <div class="sw-tab-panel" id="entities-panel">
                                            <div class="sw-entity-visualization">${visualizationHtml}</div>
                                        </div>
                                        <div class="sw-tab-panel" id="key-phrases-panel">
                                            <div id="key-phrases-content">Key Phrases: ${keyPhrases}</div>
                                        </div>
                                        <div class="sw-tab-panel" id="language-panel">
                                            <div id="language-content">Language: English (assuming English for now)</div>
                                        </div>
                                        <div class="sw-tab-panel" id="pii-panel">
                                            <div id="pii-content">No PII detected (implement PII detection if needed)</div>
                                        </div>
                                        <div class="sw-tab-panel" id="sentiment-panel">
                                            <div id="sentiment-content">Sentiment: ${sentimentDisplay}</div>
                                        </div>
                                    </div>
                                </div>
                            `, 'success');
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                            console.error('Visualization fetch failed:', {
                                status: textStatus,
                                error: errorThrown,
                                response: jqXHR.responseText
                            });
                            showResponse('Failed to load entity visualization. Check console for details.', 'error');
                        }
                    });
                } else {
                    showResponse(response.message || 'An error occurred.', 'error');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('URL submission failed:', textStatus, errorThrown);
                showResponse('An error occurred while processing your request.', 'error');
            }
        });
    });
});
