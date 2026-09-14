import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateChatCompletion, getRelevantContext } from '@/lib/services/rag';

export async function POST(req) {
    try {
        const { orgId } = await auth();
        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1]?.content;

        if (!lastMessage) {
            return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
        }

        const context = await getRelevantContext(orgId, lastMessage);
        const aiResponse = await generateChatCompletion(context, lastMessage);

        return NextResponse.json({ text: aiResponse });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}