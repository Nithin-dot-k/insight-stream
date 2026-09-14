import { supabase } from '@/lib/supabase';
import pdf from 'pdf-parse-fork';

export async function generateEmbedding(text, inputType = 'search_query') {
    const response = await fetch('https://api.cohere.com/v1/embed', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            texts: [text],
            model: 'embed-english-v3.0',
            input_type: inputType,
        }),
    });

    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload?.error?.message || 'Embedding generation failed.');
    }

    return payload.embeddings?.[0];
}

export async function getRelevantContext(orgId, prompt) {
    const vector = await generateEmbedding(prompt, 'search_query');

    const { data: chunks, error } = await supabase.rpc('match_documents', {
        query_embedding: vector,
        match_threshold: 0.01,
        match_count: 5,
        filter_org_id: orgId,
    });

    if (error) throw error;

    return chunks && chunks.length > 0 ? chunks.map((chunk) => chunk.content).join('\n\n') : 'Empty context.';
}

export async function generateChatCompletion(context, prompt) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: `Answer using ONLY this context:\n\n${context}` },
                { role: 'user', content: prompt },
            ],
            model: 'llama-3.1-8b-instant',
        }),
    });

    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload?.error?.message || 'LLM request failed.');
    }

    return payload.choices?.[0]?.message?.content;
}

export async function ingestPdfDocumentForOrg({ orgId, fileName, fileBuffer }) {
    const parsedPdf = await pdf(fileBuffer);
    const chunks = parsedPdf.text.split('\n\n').filter((chunk) => chunk.length > 50);

    const response = await fetch('https://api.cohere.com/v1/embed', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            texts: chunks,
            model: 'embed-english-v3.0',
            input_type: 'search_document',
        }),
    });

    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload?.error?.message || 'Embedding generation failed.');
    }

    const embeddings = payload.embeddings;

    if (!embeddings || embeddings.length === 0) {
        throw new Error('Cohere failed to generate embeddings.');
    }

    const insertPromises = chunks.map((chunk, index) =>
        supabase.from('documents').insert({
            content: chunk,
            embedding: embeddings[index],
            org_id: orgId,
            filename: fileName,
        })
    );

    const results = await Promise.all(insertPromises);
    const failedInsert = results.find((result) => result.error);

    if (failedInsert?.error) {
        throw failedInsert.error;
    }

    return { message: 'Done' };
}
