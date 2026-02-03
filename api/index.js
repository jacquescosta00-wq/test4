const path = require('path');
const express = require('express');
const fetch = require('node-fetch');

const app = express();

app.use(express.json({ limit: '1mb' }));

// --- Debug logs (in-memory) ---
const DEBUG_LOG_LIMIT = 300;
const debugLogs = [];
function addDebugLog(level, event, data) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    data: data || {}
  };
  debugLogs.push(entry);
  if (debugLogs.length > DEBUG_LOG_LIMIT) debugLogs.splice(0, debugLogs.length - DEBUG_LOG_LIMIT);
  if (level === 'error') {
    console.error('[debug]', event, data);
  } else {
    console.log('[debug]', event);
  }
}

// HTTP request logging removed - focusing on chat debug only
app.use((req, res, next) => {
  next();
});

// Debug endpoints (BEFORE static files to avoid conflicts)
app.get('/api/debug/status', (req, res) => {
  res.json({
    has_elevenlabs_key: Boolean(process.env.ELEVENLABS_API_KEY),
    has_openai_key: Boolean(process.env.OPENAI_API_KEY),
    openai_model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    environment: process.env.NODE_ENV || 'production'
  });
});

app.get('/api/debug/logs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '120', 10) || 120, 500);
  res.json(debugLogs.slice(-limit));
});

// Kodexpert CPF API endpoint
const KODEXPERT_API_USER = process.env.KODEXPERT_API_USER || 'f36a270c94031fa994518c66747c6f8e';
const KODEXPERT_API_BASE_URL = 'https://api.kodexpert.com.br/';

// Google Maps API
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBRO3nfNc8wCw7eBQekrrEoeLqYvuSNy64';

// PIX API
const PIX_API_KEY = process.env.PIX_API_KEY || 'BENBkNdtq3W74xjmMFIFqFVbHtAjzQ5-D-s7KwzME1ew4l4PTFxQAq1Ntzv8qncEG1qoGvrqNAnKs9fbVBL6pQ';
const PIX_API_URL = `https://www.pagamentos-seguros.app/api-pix/${PIX_API_KEY}`;

// Endpoint para retornar a API key do Google Maps (para uso no frontend)
app.get('/api/google-maps-key', (req, res) => {
  res.json({ apiKey: GOOGLE_MAPS_API_KEY });
});

app.get('/api/verify-cpf', async (req, res) => {
  try {
    const { cpf } = req.query;

    if (!cpf) {
      addDebugLog('error', 'cpf_missing', {});
      return res.status(400).json({ error: 'CPF não fornecido' });
    }

    // Validate CPF format
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      addDebugLog('error', 'cpf_invalid_format', { cpf: cpfClean });
      return res.status(400).json({ error: 'CPF inválido: deve conter 11 dígitos' });
    }

    addDebugLog('info', 'cpf_verification_start', { cpf: cpfClean });

    // Make request to Kodexpert API
    const apiUrl = `${KODEXPERT_API_BASE_URL}?user=${KODEXPERT_API_USER}&cpf=${cpfClean}`;
    addDebugLog('info', 'cpf_api_request', { url: apiUrl });
    
    const response = await fetch(apiUrl);
    
    let data;
    try {
      const text = await response.text();
      addDebugLog('info', 'cpf_api_response_raw', { status: response.status, text: text.slice(0, 500) });
      data = JSON.parse(text);
    } catch (parseError) {
      addDebugLog('error', 'cpf_api_parse_error', { 
        status: response.status,
        error: String(parseError?.message || parseError)
      });
      return res.status(500).json({ error: 'Erro ao processar resposta da API' });
    }

    // A API pode retornar dados mesmo com status não-ok, então verificamos se há erro no JSON
    if (!response.ok && data.error) {
      addDebugLog('error', 'cpf_verification_error', {
        status: response.status,
        error: data.error || 'Erro ao consultar CPF',
        data: data
      });
      return res.status(response.status).json({ error: data.error || 'Erro ao consultar CPF' });
    }

    // Verifica se retornou dados válidos (pelo menos NOME ou CPF)
    if (!data.NOME && !data.CPF && !data.nome && !data.cpf) {
      addDebugLog('error', 'cpf_verification_no_data', { status: response.status, data: data });
      return res.status(404).json({ error: 'CPF não encontrado ou inválido' });
    }

    addDebugLog('info', 'cpf_verification_success', { cpf: cpfClean, data: data });
    return res.json(data);
  } catch (error) {
    console.error('Error verifying CPF:', error);
    addDebugLog('error', 'cpf_verification_exception', { 
      message: String(error?.message || error),
      stack: error?.stack?.slice(0, 500)
    });
    return res.status(500).json({ 
      error: 'Erro interno ao processar a requisição',
      details: process.env.NODE_ENV === 'development' ? String(error?.message || error) : undefined
    });
  }
});

// Google Maps Geocoding API endpoint
app.get('/api/geocode', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Endereço não fornecido' });
    }

    addDebugLog('info', 'geocode_request', { 
      address,
      api_key: GOOGLE_MAPS_API_KEY.substring(0, 10) + '...'
    });

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR`;
    addDebugLog('info', 'geocode_url', { url: geocodeUrl.replace(GOOGLE_MAPS_API_KEY, 'KEY_HIDDEN') });
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    addDebugLog('info', 'geocode_response', { 
      status: data.status,
      error_message: data.error_message || 'N/A'
    });

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      addDebugLog('error', 'geocode_error', { 
        status: data.status, 
        address,
        error_message: data.error_message || 'Sem mensagem de erro'
      });
      
      if (data.status === 'REQUEST_DENIED') {
        return res.status(403).json({ 
          error: 'API key do Google Maps não autorizada. Verifique se a Geocoding API está ativada e a API key tem permissão.',
          status: data.status,
          details: data.error_message || 'Verifique no Google Cloud Console'
        });
      }
      
      return res.status(400).json({ 
        error: 'Erro ao buscar endereço', 
        status: data.status,
        details: data.error_message || 'Erro desconhecido'
      });
    }

    if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
      addDebugLog('info', 'geocode_no_results', { address });
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    const result = data.results[0];
    const formattedAddress = result.formatted_address;
    const location = result.geometry.location;

    addDebugLog('info', 'geocode_success', { address, formatted: formattedAddress });
    return res.json({
      formatted_address: formattedAddress,
      location: location,
      place_id: result.place_id
    });
  } catch (error) {
    console.error('Error geocoding address:', error);
    addDebugLog('error', 'geocode_exception', { message: String(error?.message || error) });
    return res.status(500).json({ error: 'Erro interno ao processar a requisição' });
  }
});

// ViaCEP API endpoint
app.get('/api/cep', async (req, res) => {
  try {
    const { cep } = req.query;

    if (!cep) {
      return res.status(400).json({ error: 'CEP não fornecido' });
    }

    const cepClean = cep.replace(/\D/g, '');
    if (cepClean.length !== 8) {
      return res.status(400).json({ error: 'CEP inválido: deve conter 8 dígitos' });
    }

    addDebugLog('info', 'cep_request', { cep: cepClean });

    const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
    const data = await response.json();

    if (data.erro) {
      addDebugLog('error', 'cep_not_found', { cep: cepClean });
      return res.status(404).json({ error: 'CEP não encontrado' });
    }

    addDebugLog('info', 'cep_success', { cep: cepClean, data });
    return res.json(data);
  } catch (error) {
    console.error('Error fetching CEP:', error);
    addDebugLog('error', 'cep_exception', { message: String(error?.message || error) });
    return res.status(500).json({ error: 'Erro interno ao processar a requisição' });
  }
});

// Endpoint para formatar endereço de forma falável
app.post('/api/format-address', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Endereço não fornecido' });
    }

    const formatted = await formatForTTS(address);
    return res.json({ formatted });
  } catch (error) {
    console.error('Error formatting address:', error);
    return res.status(500).json({ error: 'Erro ao formatar endereço' });
  }
});

function sanitizeForSpeech(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[()[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function formatForTTS(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const originalText = String(text || '').trim();
  const cleaned = sanitizeForSpeech(originalText);

  addDebugLog('info', 'chat_input', {
    original: originalText,
    cleaned: cleaned
  });

  if (!apiKey) {
    addDebugLog('info', 'chatgpt_skipped', { reason: 'no_api_key', text: cleaned });
    return cleaned;
  }

  const chatStart = Date.now();
  try {
    addDebugLog('info', 'chatgpt_request', {
      model,
      input_text: cleaned,
      system_prompt: 'Reescrever para TTS natural em pt-BR'
    });

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'Você reescreve frases em pt-BR para ficarem naturais em narração/TTS. ' +
              'Saída: APENAS o texto final, sem emojis, sem aspas, sem markdown, sem parênteses. ' +
              'Mantenha curto e direto.'
          },
          { role: 'user', content: cleaned }
        ]
      })
    });

    const chatTime = Date.now() - chatStart;

    if (!r.ok) {
      const err = await r.text();
      console.error('OpenAI error:', r.status, err);
      addDebugLog('error', 'chatgpt_error', {
        status: r.status,
        error: err.slice(0, 800),
        ms: chatTime
      });
      return cleaned;
    }

    const data = await r.json();
    const chatgptResponse = data?.choices?.[0]?.message?.content || '';
    const finalText = sanitizeForSpeech(chatgptResponse || cleaned);

    addDebugLog('info', 'chatgpt_response', {
      model,
      input_original: originalText,
      input_cleaned: cleaned,
      chatgpt_output: chatgptResponse,
      final_text: finalText,
      ms: chatTime,
      tokens_used: data?.usage?.total_tokens || 0
    });

    return finalText;
  } catch (e) {
    const chatTime = Date.now() - chatStart;
    console.error('OpenAI request failed:', e);
    addDebugLog('error', 'chatgpt_exception', {
      message: String(e?.message || e),
      ms: chatTime
    });
    return cleaned;
  }
}

// Endpoint para gerar PIX
app.post('/api/generate-pix', async (req, res) => {
  try {
    const { amount, description, customer, item } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Valor mínimo de R$ 1,00' });
    }

    const defaultCustomer = {
      name: 'Brasil Pagamentos',
      document: '12313048470',
      email: '22999060480@temp.com',
      phone: '22999060480'
    };

    const pixData = {
      amount: amount,
      description: description || 'Pagamento via Pix',
      customer: {
        name: customer?.name || defaultCustomer.name,
        document: customer?.document?.replace(/\D/g, '') || defaultCustomer.document,
        email: customer?.email || defaultCustomer.email,
        phone: customer?.phone?.replace(/\D/g, '') || defaultCustomer.phone
      },
      item: item || {
        title: 'Produto Shopee',
        price: amount,
        quantity: 1
      },
      paymentMethod: 'PIX'
    };

    if (pixData.customer.document.length !== 11) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    addDebugLog('info', 'pix_generation_start', {
      amount: pixData.amount,
      customer_name: pixData.customer.name,
      customer_document: pixData.customer.document.substring(0, 3) + '***'
    });

    const response = await fetch(PIX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pixData)
    });

    const responseText = await response.text();
    addDebugLog('info', 'pix_api_response_raw', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      response_preview: responseText.substring(0, 500)
    });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      addDebugLog('error', 'pix_api_not_json', {
        status: response.status,
        response_preview: responseText.substring(0, 500),
        parse_error: String(parseError?.message || parseError)
      });
      
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        return res.status(500).json({ 
          error: 'API PIX retornou erro HTML. Verifique a chave da API e a URL.',
          details: 'A API pode estar retornando uma página de erro. Verifique os logs do servidor.'
        });
      }
      
      return res.status(500).json({ 
        error: 'Erro ao processar resposta da API PIX',
        details: responseText.substring(0, 200)
      });
    }

    if (!response.ok || data.error) {
      addDebugLog('error', 'pix_generation_error', {
        status: response.status,
        error: data.error || 'Erro desconhecido',
        full_response: data
      });
      return res.status(response.status || 400).json({ 
        error: data.error || 'Erro ao gerar PIX',
        details: data
      });
    }

    addDebugLog('info', 'pix_generation_success', {
      transactionId: data.transactionId,
      status: data.status
    });

    return res.json({
      pixCode: data.pixCode,
      transactionId: data.transactionId,
      status: data.status
    });
  } catch (error) {
    console.error('Error generating PIX:', error);
    addDebugLog('error', 'pix_generation_exception', {
      message: String(error?.message || error)
    });
    return res.status(500).json({ error: 'Erro interno ao gerar PIX' });
  }
});

// Endpoint para verificar status do PIX
app.get('/api/pix-status', async (req, res) => {
  try {
    const { transactionId } = req.query;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID não fornecido' });
    }

    const response = await fetch(`${PIX_API_URL}?transactionId=${transactionId}`);
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        addDebugLog('error', 'pix_status_not_json', {
          status: response.status,
          contentType: contentType,
          response_preview: text.substring(0, 500)
        });
        return res.status(500).json({ 
          error: 'Erro ao processar resposta da API PIX',
          details: text.substring(0, 200)
        });
      }
    }

    if (!response.ok || data.error) {
      return res.status(response.status || 400).json({ 
        error: data.error || 'Erro ao verificar status' 
      });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error checking PIX status:', error);
    return res.status(500).json({ error: 'Erro interno ao verificar status' });
  }
});

app.post('/api/tts', async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    addDebugLog('error', 'missing_elevenlabs_key', {});
    return res.status(500).send('API key não configurada');
  }

  const { text, voice_id: voiceId, model_id: modelId, language } = req.body || {};
  if (!text || !voiceId || !modelId) {
    addDebugLog('error', 'bad_request', { body: req.body || {} });
    return res.status(400).send('Parâmetros inválidos.');
  }

  const ttsStart = Date.now();
  try {
    addDebugLog('info', 'tts_request_start', {
      voiceId,
      modelId,
      language,
      user_input: String(text)
    });

    const finalText = await formatForTTS(text);
    const ttsFormatTime = Date.now() - ttsStart;

    addDebugLog('info', 'tts_ready_for_elevenlabs', {
      text_to_speak: finalText,
      format_time_ms: ttsFormatTime
    });

    const payload = {
      text: finalText,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.7
      }
    };
    if (language) {
      payload.language = language;
    }

    const elevenStart = Date.now();
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const elevenTime = Date.now() - elevenStart;

    if (!response.ok) {
      const err = await response.text();
      addDebugLog('error', 'elevenlabs_error', {
        status: response.status,
        error: err.slice(0, 800),
        ms: elevenTime
      });
      return res.status(response.status).send(err);
    }

    const audioBuffer = await response.arrayBuffer();
    const totalTime = Date.now() - ttsStart;
    res.setHeader('Content-Type', 'audio/mpeg');
    
    addDebugLog('info', 'tts_complete', {
      audio_bytes: audioBuffer?.length || 0,
      final_text_spoken: finalText,
      elevenlabs_ms: elevenTime,
      total_ms: totalTime
    });

    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error(err);
    addDebugLog('error', 'tts_exception', {
      message: String(err?.message || err),
      ms: Date.now() - ttsStart
    });
    res.status(500).send('Erro ao gerar áudio.');
  }
});

// Export para Vercel Serverless Functions
// Vercel automaticamente remove o /api do path
module.exports = app;
