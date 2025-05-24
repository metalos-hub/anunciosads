// script.js
document.addEventListener('DOMContentLoaded', () => {
    const productDescriptionInput = document.getElementById('productDescription');
    const targetAudienceInput = document.getElementById('targetAudience');
    // const adPlatformInput = document.getElementById('adPlatform'); // Removido
    const generateButton = document.getElementById('generateButton');
    
    const loadingSection = document.getElementById('loading');
    const errorSection = document.getElementById('error');
    const errorText = errorSection.querySelector('p');
    const resultsSection = document.getElementById('results');
    const platformResultsTitle = document.getElementById('platformResultsTitle');

    // Seletores para Google Ads
    const headlinesListGoogle = document.getElementById('headlinesSection').querySelector('ul');
    const descriptionsListGoogle = document.getElementById('descriptionsSection').querySelector('ul');
    const sitelinksSectionGoogle = document.getElementById('sitelinksSection');
    const calloutsListGoogle = document.getElementById('calloutsSection').querySelector('ul');
    const structuredSnippetContentGoogle = document.getElementById('structuredSnippetContent');
    const callToActionsListGoogle = document.getElementById('callToActionsSection').querySelector('ul');
    const googleAdsResultElements = document.querySelectorAll('.google-ads-results');

    // Seletores para Facebook Ads
    const facebookPrimaryTextsList = document.getElementById('facebookPrimaryTextsSection').querySelector('ul');
    const facebookHeadlinesList = document.getElementById('facebookHeadlinesSection').querySelector('ul');
    const facebookLinkDescriptionsList = document.getElementById('facebookLinkDescriptionsSection').querySelector('ul');
    const facebookCTAsList = document.getElementById('facebookCTAsSection').querySelector('ul');
    const facebookAdsResultElements = document.querySelectorAll('.facebook-ads-results');


    generateButton.addEventListener('click', async () => {
        const productDescription = productDescriptionInput.value.trim();
        const targetAudience = targetAudienceInput.value.trim();
        const selectedPlatformRadio = document.querySelector('input[name="adPlatform"]:checked');
        
        if (!selectedPlatformRadio) {
            showError('Por favor, selecione uma plataforma de anúncio.');
            return;
        }
        const adPlatform = selectedPlatformRadio.value;

        if (!productDescription) {
            showError('Por favor, descreva seu produto ou serviço.');
            return;
        }

        setLoading(true);
        hideError();
        hideResults();

        try {
            const response = await fetch('/api/generate-ads', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productDescription, targetAudience, adPlatform }), // Envia a plataforma selecionada
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Erro da API (não OK):", data);
                let errorMessage = data.error || `Erro HTTP: ${response.status}`;
                if (data.details) {
                   errorMessage += ` (Detalhes: ${ typeof data.details === 'string' ? data.details : JSON.stringify(data.details) })`;
                }
                throw new Error(errorMessage);
            }
            
            displayResults(data, data.platform_used || adPlatform); // Passa a plataforma usada para displayResults

        } catch (err) {
            console.error('Erro no script ao gerar anúncios:', err);
            showError(`Falha ao gerar anúncios: ${err.message}`);
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        generateButton.disabled = isLoading;
        loadingSection.style.display = isLoading ? 'block' : 'none';
    }

    function showError(message) {
        errorText.innerHTML = message;
        errorSection.style.display = 'block';
    }

    function hideError() {
        errorSection.style.display = 'none';
    }

    function hideResults() {
        resultsSection.style.display = 'none';
        platformResultsTitle.textContent = '';

        // Limpar e esconder seções do Google Ads
        googleAdsResultElements.forEach(el => el.style.display = 'none');
        headlinesListGoogle.innerHTML = '';
        descriptionsListGoogle.innerHTML = '';
        sitelinksSectionGoogle.innerHTML = '<h3>🔗 Sitelinks - Google Ads</h3>';
        calloutsListGoogle.innerHTML = '';
        structuredSnippetContentGoogle.innerHTML = '';
        callToActionsListGoogle.innerHTML = '';

        // Limpar e esconder seções do Facebook Ads
        facebookAdsResultElements.forEach(el => el.style.display = 'none');
        facebookPrimaryTextsList.innerHTML = '';
        facebookHeadlinesList.innerHTML = '';
        facebookLinkDescriptionsList.innerHTML = '';
        facebookCTAsList.innerHTML = '';
    }

    function displayResults(data, platform) {
        hideResults(); // Limpa e esconde tudo primeiro
        platformResultsTitle.textContent = platform; // Atualiza o título da seção de resultados

        if (platform === "Google Ads") {
            googleAdsResultElements.forEach(el => el.style.display = 'block');
            facebookAdsResultElements.forEach(el => el.style.display = 'none');

            populateList(headlinesListGoogle, data.headlines || [], true);
            populateList(descriptionsListGoogle, data.descriptions || [], true);
            displaySitelinks(sitelinksSectionGoogle, data.sitelinks || [], platform);
            populateList(calloutsListGoogle, data.callouts || [], true);
            displayStructuredSnippet(structuredSnippetContentGoogle, data.structured_snippets || {}, platform);
            populateList(callToActionsListGoogle, data.call_to_actions || [], true);

        } else if (platform === "Facebook Ads") {
            facebookAdsResultElements.forEach(el => el.style.display = 'block');
            googleAdsResultElements.forEach(el => el.style.display = 'none');

            populateList(facebookPrimaryTextsList, data.facebook_primary_texts || [], true);
            populateList(facebookHeadlinesList, data.facebook_headlines || [], true);
            populateList(facebookLinkDescriptionsList, data.facebook_link_descriptions || [], true);
            populateList(facebookCTAsList, data.facebook_ctas || [], true);
        }
        
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function populateList(ulElement, items, addCopyButton = false) {
        ulElement.innerHTML = '';
        if (items && items.length > 0) {
            items.forEach(itemText => {
                const li = document.createElement('li');
                li.textContent = itemText;
                
                if (addCopyButton) {
                    const copyButton = document.createElement('button');
                    copyButton.textContent = 'Copiar';
                    copyButton.className = 'copy-btn';
                    copyButton.onclick = () => copyToClipboard(itemText, copyButton);
                    li.appendChild(copyButton);
                }
                ulElement.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Nenhum item gerado para esta categoria.';
            ulElement.appendChild(li);
        }
    }

    function displaySitelinks(sitelinksContainer, sitelinks, platform) {
        sitelinksContainer.innerHTML = `<h3>🔗 Sitelinks - ${platform}</h3>`; // Limpa e adiciona o título de volta
        if (sitelinks && sitelinks.length > 0) {
            const ul = document.createElement('ul');
            sitelinks.forEach(sitelink => {
                const li = document.createElement('li');
                li.className = 'sitelink-item-display';

                const titleDiv = document.createElement('div');
                titleDiv.className = 'sitelink-title-display';
                titleDiv.textContent = `${sitelink.sitelink_title || 'Título não gerado'}`;

                const desc1Div = document.createElement('div');
                desc1Div.className = 'sitelink-desc-display';
                desc1Div.textContent = `${sitelink.sitelink_desc1 || 'Descrição 1 não gerada'}`;
                
                const desc2Div = document.createElement('div');
                desc2Div.className = 'sitelink-desc-display';
                desc2Div.textContent = `${sitelink.sitelink_desc2 || 'Descrição 2 não gerada'}`;

                const fullSitelinkText = `${sitelink.sitelink_title || ''}\n${sitelink.sitelink_desc1 || ''}\n${sitelink.sitelink_desc2 || ''}`.trim();
                const copyButton = document.createElement('button');
                copyButton.textContent = 'Copiar';
                copyButton.className = 'copy-btn sitelink-copy-btn';
                copyButton.onclick = () => copyToClipboard(fullSitelinkText, copyButton);

                li.appendChild(titleDiv);
                li.appendChild(desc1Div);
                li.appendChild(desc2Div);
                li.appendChild(copyButton);
                ul.appendChild(li);
            });
            sitelinksContainer.appendChild(ul);
        } else {
            const p = document.createElement('p');
            p.textContent = 'Nenhum sitelink gerado.';
            sitelinksContainer.appendChild(p);
        }
    }

    function displayStructuredSnippet(snippetContainer, snippet, platform) {
        snippetContainer.innerHTML = ''; // Limpa
        if (snippet && snippet.header && snippet.values && snippet.values.length > 0) {
            const headerP = document.createElement('p');
            headerP.className = 'snippet-header-display';
            headerP.innerHTML = `<strong>${snippet.header || 'Cabeçalho não gerado'}:</strong>`;
            
            const valuesUl = document.createElement('ul');
            valuesUl.className = 'snippet-values-list';
            snippet.values.forEach(value => {
                const valueLi = document.createElement('li');
                valueLi.textContent = value || 'Valor não gerado';
                valuesUl.appendChild(valueLi);
            });

            const fullSnippetText = `${snippet.header || ''}: ${snippet.values.join(', ')}`.trim();
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copiar';
            copyButton.className = 'copy-btn snippet-copy-btn';
            copyButton.onclick = () => copyToClipboard(fullSnippetText, copyButton);

            snippetContainer.appendChild(headerP);
            snippetContainer.appendChild(valuesUl);
            snippetContainer.appendChild(copyButton);
        } else {
            const p = document.createElement('p');
            p.textContent = 'Nenhum snippet estruturado gerado.';
            snippetContainer.appendChild(p);
        }
    }

    function copyToClipboard(text, buttonElement) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Copiado!';
            buttonElement.classList.add('copied');
            buttonElement.disabled = true; 
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.classList.remove('copied');
                buttonElement.disabled = false;
            }, 1500);
        }).catch(err => {
            console.error('Erro ao copiar com navigator.clipboard:', err);
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);

                const originalText = buttonElement.textContent;
                buttonElement.textContent = 'Copiado!';
                buttonElement.classList.add('copied');
                buttonElement.disabled = true;
                setTimeout(() => {
                    buttonElement.textContent = originalText;
                    buttonElement.classList.remove('copied');
                    buttonElement.disabled = false;
                }, 1500);
            } catch (fallbackErr) {
                console.error('Erro ao copiar com fallback execCommand:', fallbackErr);
                alert('Não foi possível copiar o texto. Por favor, copie manualmente.');
            }
        });
    }
});