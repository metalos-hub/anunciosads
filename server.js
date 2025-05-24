// server.js
require('dotenv').config();
const express = require('express');
const { Groq } = require('groq-sdk');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3002;

if (!process.env.GROQ_API_KEY) {
  console.error("ERRO: GROQ_API_KEY não está definida no arquivo .env");
  process.exit(1);
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/**
 * Constrói um prompt robusto para anúncios, extrai atributos e impõe formatação JSON.
 * Suporta Google Ads e Facebook Ads, focado em imóveis de alto padrão.
 */
function buildAdsPrompt({ productDescription, targetAudience = 'não especificado', adPlatform }) {
  const extractInfo =
    'Antes de tudo, analise a descrição do imóvel e identifique mentalmente até 8 atributos-chave ou diferenciais (ex: Suíte Master, Varanda Gourmet, 125m², Vista Mar, Segurança 24h). Você usará esses atributos para os sitelinks do Google Ads.';

  const baseInstructions = `
Requisitos Gerais OBRIGATÓRIOS:
- Idioma: Português Brasileiro
- Tom de Voz: Sofisticado, elegante, aspiracional e focado em exclusividade e qualidade premium.
- Formato da Resposta: JSON puro e válido, sem nenhum texto, comentário ou introdução fora do objeto JSON.
- Limites de Caracteres: CUMPRA RIGOROSAMENTE TODOS OS LIMITES DE CARACTERES ESPECIFICADOS. Textos que excederem serão inutilizáveis. Verifique o comprimento de cada item gerado.
`;

  const audienceFocusInstruction = `
IMPORTANTE: Se um público-alvo específico for fornecido em "Dados de Entrada", adapte CUIDADOSAMENTE a linguagem, os benefícios destacados e o tom geral para ressoar profundamente com esse grupo específico. Mantenha o foco geral em alto padrão, mas personalize a abordagem para o público-alvo informado. Se "não especificado", mantenha o foco amplo em alto padrão.
`;

  if (adPlatform === 'Google Ads') {
    return `Você é um especialista em marketing digital e copywriting para Google Ads, mestre em criar anúncios concisos e persuasivos para um público de altíssimo padrão.
${audienceFocusInstruction}
Dados de Entrada:
- Descrição do Imóvel: "${productDescription}"
- Público-alvo: ${targetAudience}
- Plataforma: ${adPlatform}
${baseInstructions}
${extractInfo}

Componentes a serem gerados para Google Ads (JSON):
1. "headlines": 20 (vinte) títulos. Devem ser curtos, impactantes e transmitir exclusividade ou um benefício único. ADAPTE para o público-alvo, se fornecido. MÁXIMO ABSOLUTO de 30 caracteres CADA.
2. "descriptions": 8 (oito) descrições. Devem ser elegantes, ressaltar o luxo e os benefícios premium do imóvel, e ter um apelo emocional sutil. ADAPTE para o público-alvo, se fornecido. Devem ter entre 70 e 90 caracteres. É IMPERATIVO NÃO ULTRAPASSAR 90 CARACTERES POR DESCRIÇÃO.
3. "sitelinks": 8 (oito) sitelinks. Utilize os atributos-chave do imóvel que você identificou anteriormente. ADAPTE os títulos e descrições dos sitelinks para o público-alvo, se fornecido, destacando o que seria mais relevante para ele. Cada sitelink deve ter:
   - "sitelink_title": Título curto e direto. MÁXIMO 25 caracteres.
   - "sitelink_desc1": Primeira linha da descrição. MÁXIMO 35 caracteres.
   - "sitelink_desc2": Segunda linha da descrição. MÁXIMO 35 caracteres.
4. "callouts": 8 (oito) frases de destaque. Devem ser curtas, reforçando a exclusividade ou características premium. ADAPTE para o público-alvo, se fornecido. MÁXIMO 25 caracteres CADA.
5. "structured_snippets": Um conjunto, contendo:
   - "header": Escolha UM dos seguintes cabeçalhos, o mais apropriado para o imóvel E para o público-alvo (se fornecido): "Comodidades de Luxo", "Estilos de Vida", "Serviços Premium", "Localizações Exclusivas", "Diferenciais Únicos", "Acabamentos".
   - "values": Uma lista de 5 a 8 valores relevantes para o cabeçalho escolhido, detalhando atributos premium que atrairiam o público-alvo. MÁXIMO 25 caracteres CADA VALOR.
6. "call_to_actions": 3 (três) chamadas para ação. Devem ser curtas, diretas e sofisticadas, convidando para uma ação de alto valor. ADAPTE o CTA para o que mais motivaria o público-alvo. (ex: “Agende Sua Visita Privativa”, “Descubra a Exclusividade”, “Consulte Condições Especiais”). MÁXIMO 25 caracteres CADA.

Formato de Saída JSON Esperado:
\`\`\`json
{
  "headlines": ["Título Exclusivo 1", "Luxo e Conforto Aqui", "..."],
  "descriptions": ["Descrição elegante entre 70 e 90 caracteres, sem exceções...", "..."],
  "sitelinks": [
    {"sitelink_title":"Ex: Suíte Master","sitelink_desc1":"Refúgio de puro conforto","sitelink_desc2":"Com closet e hidro"}
    /* mais 7 objetos de sitelink baseados nos atributos do imóvel e relevantes para o público */
  ],
  "callouts": ["Alto Padrão Garantido", "Design Sofisticado", "..."],
  "structured_snippets": {"header":"Comodidades de Luxo","values":["Piscina Aquecida", "Espaço Gourmet Premium", "..."]},
  "call_to_actions": ["Agende Visita VIP", "Conheça Seu Novo Lar", "Fale com Consultor"]
}
\`\`\`
Revise todos os textos para garantir conformidade com os limites de caracteres, o tom solicitado e a adaptação ao público-alvo ANTES de gerar o JSON.
`;
  }

  if (adPlatform === 'Facebook Ads') {
    return `Você é um especialista em marketing digital e copywriting para Facebook Ads, mestre em criar narrativas visuais e textuais que encantam um público de altíssimo padrão interessado em imóveis.
${audienceFocusInstruction}
Dados de Entrada:
- Descrição do Imóvel: "${productDescription}"
- Público-alvo: ${targetAudience}
- Plataforma: ${adPlatform}
${baseInstructions}
${extractInfo} // Pode ser útil para inspirar os textos, mesmo que não usado diretamente como no Google Ads

Componentes a serem gerados para Facebook Ads (JSON):
1. "facebook_primary_texts": 5 (cinco) opções de Textos Principais. Devem ser narrativas envolventes e aspiracionais, pintando um quadro do estilo de vida que o imóvel proporciona e que seria desejado pelo público-alvo. Use parágrafos curtos e inclua 2 a 3 emojis estrategicamente posicionados para adicionar emoção e apelo visual (ex: ✨🏡💎). MÁXIMO 300 caracteres CADA (idealmente entre 150-250).
2. "facebook_headlines": 5 (cinco) opções de Títulos. Devem ser curtos, extremamente chamativos e capturar a atenção do público-alvo imediatamente. Inclua 1 emoji relevante no início ou final de cada título. MÁXIMO 40 caracteres CADA.
3. "facebook_link_descriptions": 3 (três) opções de Descrições de Link (News Feed Link Description). Devem ser concisas e complementar o título, incentivando o clique do público-alvo. MÁXIMO 30 caracteres CADA.
4. "facebook_ctas": 3 (três) sugestões de texto para botões de Call to Action, que sejam convidativos para o público-alvo, usando emojis se apropriado (ex: "✨ Saiba Mais", "🗓️ Agendar Visita", "💎 Descubra o Luxo", "📲 Fale Conosco").

Formato de Saída JSON Esperado:
\`\`\`json
{
  "facebook_primary_texts": ["✨ Viva o ápice do luxo neste imóvel espetacular... [mais detalhes e emojis relevantes para o público]...", "..."],
  "facebook_headlines": ["🏡 Seu Novo Paraíso Particular!", "💎 Exclusividade e Sofisticação", "..."],
  "facebook_link_descriptions": ["Localização Ímpar. Agende!", "Detalhes que Fascinam.", "..."],
  "facebook_ctas": ["✨ Saiba Mais", "🗓️ Agendar Visita", "💎 Descubra o Luxo"]
}
\`\`\`
Revise todos os textos para garantir conformidade com os limites de caracteres, uso de emojis, o tom solicitado e a adaptação ao público-alvo ANTES de gerar o JSON.
`;
  }

  // Se nenhuma plataforma corresponder, lança um erro que será pego pelo catch na rota
  throw new Error(`Plataforma '${adPlatform}' não suportada para geração de prompt.`);
}

app.post('/api/generate-ads', async (req, res) => {
  const { productDescription, targetAudience, adPlatform } = req.body;
  let assistantResponseContent; // Para ter acesso no bloco catch

  if (!productDescription || !adPlatform) {
    return res.status(400).json({ error: 'productDescription e adPlatform são obrigatórios.' });
  }

  try {
    const prompt = buildAdsPrompt({ productDescription, targetAudience, adPlatform });
    console.log(`Enviando prompt para Groq (plataforma: ${adPlatform}, público: ${targetAudience || 'N/A'})...`); // Log adicionado

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.65,
      max_tokens: 6500,
      top_p: 1,
      stream: false,
      response_format: { type: 'json_object' },
    });

    assistantResponseContent = response.choices?.[0]?.message?.content;
    if (!assistantResponseContent) throw new Error('Resposta vazia da API Groq');

    console.log('Resposta inicial da Groq:', assistantResponseContent.slice(0, 200), '...');
    let parsed = JSON.parse(assistantResponseContent);
    parsed.platform_used = adPlatform;

    // PÓS-PROCESSAMENTO PARA DESCRIÇÕES DO GOOGLE ADS
    if (adPlatform === 'Google Ads' && parsed.descriptions) {
      const MAX_DESC_LENGTH = 90;
      // const MIN_DESC_LENGTH = 70; // Removido pois o foco é não exceder o máximo

      parsed.descriptions = parsed.descriptions.map(desc => {
        if (typeof desc !== 'string') return desc;

        if (desc.length > MAX_DESC_LENGTH) {
          console.warn(`WARN: Descrição do Google Ads truncada. Original ("${desc}", ${desc.length} chars)`);
          let truncatedDesc = desc.substring(0, MAX_DESC_LENGTH);
          if (desc[MAX_DESC_LENGTH] && desc[MAX_DESC_LENGTH] !== ' ' && truncatedDesc.lastIndexOf(' ') > 0) {
            truncatedDesc = truncatedDesc.substring(0, truncatedDesc.lastIndexOf(' '));
          }
          if (truncatedDesc.length < desc.length && !['.', '!', '?'].includes(truncatedDesc.slice(-1))) {
            if (truncatedDesc.length <= MAX_DESC_LENGTH - 3) {
              truncatedDesc += '...';
            } else {
                truncatedDesc = truncatedDesc.substring(0, MAX_DESC_LENGTH);
            }
          }
          if (truncatedDesc.length > MAX_DESC_LENGTH) {
             truncatedDesc = truncatedDesc.substring(0, MAX_DESC_LENGTH);
          }
          console.warn(`   Truncada para: "${truncatedDesc}", ${truncatedDesc.length} chars`);
          return truncatedDesc;
        }
        return desc;
      });
    }

    return res.json(parsed);

  } catch (err) {
    console.error('Erro detalhado ao gerar anúncios:', err);
    const isSyntaxError = err instanceof SyntaxError;
    let errorMessage = 'Erro interno ao gerar anúncios.';
    let errorDetails = err.message || 'Detalhes do erro não disponíveis.';

    if (isSyntaxError) {
      errorMessage = 'Erro ao processar a resposta da API: formato JSON inválido.';
      errorDetails = assistantResponseContent
        ? `Início da resposta que causou o erro: ${assistantResponseContent.slice(0, 500)}...`
        : 'Não foi possível obter a resposta da API que causou o erro de parse.';
    } else if (err.response?.data?.error?.message) {
        errorMessage = `Erro da API Groq: ${err.response.data.error.message}`;
        errorDetails = JSON.stringify(err.response.data.error);
    } else if (err.message === 'Resposta vazia da API Groq') {
        errorMessage = err.message;
        errorDetails = "A API retornou uma resposta sem conteúdo.";
    }

    return res.status(500).json({
      error: errorMessage,
      details: errorDetails,
    });
  }
});

app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));