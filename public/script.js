// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de Elementos DOM ---
    const productDescriptionInput = document.getElementById('productDescription');
    const targetAudienceInput = document.getElementById('targetAudience');
    const generateButton = document.getElementById('generateButton');
    const clearAllButton = document.getElementById('clearAllButton'); // Botão Limpar

    const loadingSection = document.getElementById('loading');
    const errorSection = document.getElementById('error');
    const errorText = errorSection.querySelector('p');
    const errorDetailsText = document.getElementById('errorDetails'); // Para detalhes de erro
    const resultsSection = document.getElementById('results');
    const platformResultsTitle = document.getElementById('platformResultsTitle');

    // Google Ads Results Elements
    const headlinesListGoogle = document.getElementById('headlinesSection').querySelector('ul');
    const descriptionsListGoogle = document.getElementById('descriptionsSection').querySelector('ul');
    const sitelinksSectionGoogle = document.getElementById('sitelinksSection');
    const calloutsListGoogle = document.getElementById('calloutsSection').querySelector('ul');
    const structuredSnippetContentGoogle = document.getElementById('structuredSnippetContent');
    const callToActionsListGoogle = document.getElementById('callToActionsSection').querySelector('ul');
    const googleAdsResultElements = document.querySelectorAll('.google-ads-results');

    // Facebook Ads Results Elements
    const facebookPrimaryTextsList = document.getElementById('facebookPrimaryTextsSection').querySelector('ul');
    const facebookHeadlinesList = document.getElementById('facebookHeadlinesSection').querySelector('ul');
    const facebookLinkDescriptionsList = document.getElementById('facebookLinkDescriptionsSection').querySelector('ul');
    const facebookCTAsList = document.getElementById('facebookCTAsSection').querySelector('ul');
    const facebookAdsResultElements = document.querySelectorAll('.facebook-ads-results');

    const SHOW_DEV_ERROR_DETAILS = true; // Mude para false em produção para esconder detalhes técnicos

    // --- Event Listeners ---
    generateButton.addEventListener('click', handleGenerateAds);
    clearAllButton.addEventListener('click', handleClearAll);

    // --- Funções Handler ---
    async function handleGenerateAds() {
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

        setLoadingState(true);
        hideError();
        // Não limpar resultados aqui, para que o usuário possa comparar se quiser,
        // hideResults() será chamado antes de displayResults()

        try {
            const response = await fetch('/api/generate-ads', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productDescription, targetAudience, adPlatform }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Erro da API (não OK):", data);
                // data.error é a mensagem amigável do backend
                // data.details_dev são os detalhes técnicos
                throw { friendlyMessage: data.error, devDetails: data.details_dev, status: response.status };
            }
            
            displayResults(data, data.platform_used || adPlatform);

        } catch (err) {
            console.error('Erro no script ao gerar anúncios:', err);
            const friendly = err.friendlyMessage || 'Falha ao gerar anúncios. Verifique sua conexão ou tente novamente.';
            const devDetails = err.devDetails || (err.message + (err.status ? ` (Status: ${err.status})` : ''));
            showError(friendly, devDetails);
        } finally {
            setLoadingState(false);
        }
    }

    function handleClearAll() {
        productDescriptionInput.value = '';
        targetAudienceInput.value = '';
        // Mantém a plataforma selecionada ou reseta para Google Ads
        // document.getElementById('googleAdsPlatform').checked = true; 
        hideResults();
        hideError();
        console.log("Formulário e resultados limpos.");
    }

    // --- Funções de Estado da UI ---
    function setLoadingState(isLoading) {
        generateButton.disabled = isLoading;
        loadingSection.style.display = isLoading ? 'block' : 'none';
    }

    function showError(message, devDetails = null) {
        errorText.innerHTML = message; // Mensagem amigável
        if (SHOW_DEV_ERROR_DETAILS && devDetails) {
            errorDetailsText.textContent = `Detalhes técnicos: ${devDetails}`;
            errorDetailsText.style.display = 'block';
        } else {
            errorDetailsText.style.display = 'none';
        }
        errorSection.style.display = 'block';
        errorSection.scrollIntoView({behavior: "smooth", block: "center"});
    }

    function hideError() {
        errorSection.style.display = 'none';
        errorDetailsText.style.display = 'none';
    }

    function hideResults() {
        resultsSection.style.display = 'none';
        platformResultsTitle.textContent = '';
        [...googleAdsResultElements, ...facebookAdsResultElements].forEach(el => el.style.display = 'none');
        
        // Limpar todas as listas UL e conteúdos de DIV
        const listsToClear = [
            headlinesListGoogle, descriptionsListGoogle, calloutsListGoogle, callToActionsListGoogle,
            facebookPrimaryTextsList, facebookHeadlinesList, facebookLinkDescriptionsList, facebookCTAsList
        ];
        listsToClear.forEach(ul => ul.innerHTML = '');
        sitelinksSectionGoogle.innerHTML = '<h3>🔗 Sitelinks - Google Ads</h3>';
        structuredSnippetContentGoogle.innerHTML = '';
    }

    // --- Funções de Display de Resultados ---
    function displayResults(data, platform) {
        hideResults(); // Limpa e esconde tudo antes de mostrar novos resultados
        platformResultsTitle.textContent = platform;

        if (platform === "Google Ads") {
            googleAdsResultElements.forEach(el => el.style.display = 'block');
            populateListWithCounters(headlinesListGoogle, data.headlines || [], 30, true);
            populateListWithCounters(descriptionsListGoogle, data.descriptions || [], 90, true);
            displaySitelinks(sitelinksSectionGoogle, data.sitelinks || [], platform);
            populateListWithCounters(calloutsListGoogle, data.callouts || [], 25, true);
            displayStructuredSnippet(structuredSnippetContentGoogle, data.structured_snippets || {}, platform);
            populateListWithCounters(callToActionsListGoogle, data.call_to_actions || [], 25, true);
        } else if (platform === "Facebook Ads") {
            facebookAdsResultElements.forEach(el => el.style.display = 'block');
            populateListWithCounters(facebookPrimaryTextsList, data.facebook_primary_texts || [], 300, true); // Limite maior
            populateListWithCounters(facebookHeadlinesList, data.facebook_headlines || [], 40, true);
            populateListWithCounters(facebookLinkDescriptionsList, data.facebook_link_descriptions || [], 30, true);
            populateListWithCounters(facebookCTAsList, data.facebook_ctas || [], 0, true); // 0 para não mostrar limite, pois são sugestões
        }
        
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function createListItemWithCharCounter(itemText, charLimit, addCopyButton) {
        const li = document.createElement('li');
        const wrapper = document.createElement('div');
        wrapper.className = 'char-counter-wrapper';

        const textSpan = document.createElement('span');
        textSpan.textContent = itemText;
        wrapper.appendChild(textSpan);

        if (charLimit > 0) { // Só mostra contador se houver limite
            const counterSpan = document.createElement('span');
            counterSpan.className = 'char-counter';
            const currentLength = itemText.length;
            counterSpan.textContent = `${currentLength}/${charLimit}`;
            if (currentLength > charLimit) {
                counterSpan.classList.add('limit-exceeded');
            }
            wrapper.appendChild(counterSpan);
        }
        li.appendChild(wrapper);

        if (addCopyButton) {
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copiar';
            copyButton.className = 'copy-btn';
            copyButton.onclick = () => copyToClipboard(itemText, copyButton);
            li.appendChild(copyButton);
        }
        return li;
    }

    function populateListWithCounters(ulElement, items, charLimit, addCopyButton = false) {
        ulElement.innerHTML = '';
        if (items && items.length > 0) {
            items.forEach(itemText => {
                ulElement.appendChild(createListItemWithCharCounter(itemText, charLimit, addCopyButton));
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Nenhum item gerado para esta categoria.';
            ulElement.appendChild(li);
        }
    }
    
    // As funções displaySitelinks e displayStructuredSnippet precisam ser adaptadas para usar createListItemWithCharCounter onde apropriado
    // ou ter sua própria lógica de contador se a estrutura for muito diferente.
    // Por simplicidade, vou manter os botões de cópia gerais para eles, mas a lógica de contador individual pode ser adicionada.

    function displaySitelinks(sitelinksContainer, sitelinks, platform) {
        sitelinksContainer.innerHTML = `<h3>🔗 Sitelinks - ${platform}</h3>`;
        if (sitelinks && sitelinks.length > 0) {
            const ul = document.createElement('ul');
            sitelinks.forEach(sitelink => {
                const li = document.createElement('li');
                li.className = 'sitelink-item-display';

                // Sitelink Title com contador
                li.appendChild(createListItemWithCharCounter(sitelink.sitelink_title || 'N/A', 25, false));
                // Sitelink Desc1 com contador
                const desc1Wrapper = document.createElement('div'); // Para identar um pouco
                desc1Wrapper.style.paddingLeft = '15px';
                desc1Wrapper.appendChild(createListItemWithCharCounter(sitelink.sitelink_desc1 || 'N/A', 35, false));
                li.appendChild(desc1Wrapper);
                // Sitelink Desc2 com contador
                const desc2Wrapper = document.createElement('div');
                desc2Wrapper.style.paddingLeft = '15px';
                desc2Wrapper.appendChild(createListItemWithCharCounter(sitelink.sitelink_desc2 || 'N/A', 35, false));
                li.appendChild(desc2Wrapper);

                const fullSitelinkText = `${sitelink.sitelink_title || ''}\n${sitelink.sitelink_desc1 || ''}\n${sitelink.sitelink_desc2 || ''}`.trim();
                const copyButton = document.createElement('button');
                copyButton.textContent = 'Copiar Sitelink Completo';
                copyButton.className = 'copy-btn sitelink-copy-btn';
                copyButton.onclick = () => copyToClipboard(fullSitelinkText, copyButton);
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
            // Header com contador (assumindo um limite, ex: 25, ou 0 se não houver limite estrito para header)
            const headerItem = createListItemWithCharCounter(snippet.header || 'N/A', 25, false); 
            headerItem.style.fontWeight = 'bold'; // Estilizar o texto do header
            headerP.appendChild(headerItem);
            
            const valuesUl = document.createElement('ul');
            valuesUl.className = 'snippet-values-list';
            snippet.values.forEach(value => {
                valuesUl.appendChild(createListItemWithCharCounter(value || 'N/A', 25, false));
            });

            const fullSnippetText = `${snippet.header || ''}: ${snippet.values.join(', ')}`.trim();
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copiar Snippet Completo';
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