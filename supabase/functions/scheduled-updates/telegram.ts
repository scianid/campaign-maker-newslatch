const ADMIN_CHATID = "366936057";
const JOSH = "1771844260";
const MOSHE_TEST = "8085865677";

function reportError(error: Error, context?: string, statusCode?: number) { 
    console.error("Error reported:", { error, context, statusCode });
}


interface Widget {
    title: string;
    _id: string;
}

interface TelegramResponse {
    ok: boolean;
    result?: any;
    error_code?: number;
    description?: string;
}

type EscapeMode = 'Markdown' | 'HTML';

export async function messageAdmin(message: string): Promise<void> {
    return await messageTo(ADMIN_CHATID, `${message}`);
}

export async function messageAdminOnIssue(message: string): Promise<void> {
    return await messageAdmin(`PROBLEM: ${message}`);
}

export async function messageTo(chatId: string, message: string): Promise<void> {
    if (message == null || message == undefined)
        return;

    const escapedMessage = escapeTelegramText(message);

    const pages = splitMessage(escapedMessage);

    for (let i = 0; i < pages.length; i++) {
        await sendToTelegram(chatId, pages[i]);
    }
}

async function sendToTelegram(chatId: string, message: string): Promise<TelegramResponse | undefined> {
    if (isEmptyMessage(message))
        return;

    const API_KEY = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const url = `https://api.telegram.org/bot${API_KEY}/sendMessage?chat_id=${chatId}&parse_mode=MarkdownV2&text=${message}`;
    const result = await fetch(url);
    const resp = await result.json() as TelegramResponse;

    if (result.status !== 200) {
        reportError(new Error(JSON.stringify(resp)), "sendToTelegram");
        console.error(JSON.stringify(resp), JSON.stringify({ message }));
    }

    return resp;
}

export async function answerCallbackQueryToTelegram(callback_query_id: string, message: string): Promise<TelegramResponse | undefined> {
    if (isEmptyMessage(message))
        return;
    const escapedMessage = escapeTelegramText(message);
    
    const API_KEY = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const url = `https://api.telegram.org/bot${API_KEY}/answerCallbackQuery?callback_query_id=${callback_query_id}&text=${escapedMessage}`;
    const result = await fetch(url);
    const resp = await result.json() as TelegramResponse;

    if (result.status !== 200) {
        reportError(new Error(JSON.stringify(resp)), "sendToTelegram", result.status);
        console.error(JSON.stringify(resp), JSON.stringify({ message }));
    }

    return resp;
}

export async function sendWidgetsToTelegram(chatId: string, widgets: Widget[], selectedTitle: string): Promise<TelegramResponse> {

    const widgetButton = (title: string, id: string): string => {
        return `{
                    "text": "${title}",
                    "callback_data": "{\\"actn\\":\\"selectWidget\\",\\"id\\":\\"${id}\\"}"
                }`;
    };
    const keyboard = `{"inline_keyboard": [[
                ${widgets.map(w => widgetButton(w.title, w._id)).join(",")}
                ]
            ]}`;

    const escapedMessage = escapeTelegramText("Currently selected: " + selectedTitle);
    const API_KEY = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const url = `https://api.telegram.org/bot${API_KEY}/sendMessage?chat_id=${chatId}&parse_mode=MarkdownV2&text=${escapedMessage}&reply_markup=${keyboard}`;
    const result = await fetch(url);
    const resp = await result.json() as TelegramResponse;

    if (result.status !== 200)
        reportError(new Error(JSON.stringify(resp)), "sendToTelegram");

    return resp;
}

export async function sendHeadlineToTelegram(chatId: string, message: string, headlineId: string): Promise<TelegramResponse> {
    const keyboard = `{"inline_keyboard": [[
                {
                    "text": "Set as 1",
                    "callback_data": "{\\"actn\\":\\"setHeadlineAsFirstWidget\\",\\"id\\":\\"${headlineId}\\"}"
                }, 
                {
                    "text": "Set as 2",
                    "callback_data": "{\\"actn\\":\\"setHeadlineAsSecondWidget\\",\\"id\\":\\"${headlineId}\\"}"
                }, 
                {
                    "text": "Set as 3",
                    "callback_data": "{\\"actn\\":\\"setHeadlineAsThirdWidget\\",\\"id\\":\\"${headlineId}\\"}"
                }, 
                {
                    "text": "Delete",
                    "callback_data": "{\\"actn\\":\\"deleteHeadline\\",\\"id\\":\\"${headlineId}\\"}"
                }]
            ]}`;

    const escapedMessage = escapeTelegramText(message);

    const API_KEY = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const url = `https://api.telegram.org/bot${API_KEY}/sendMessage?chat_id=${chatId}&parse_mode=MarkdownV2&text=${escapedMessage}&reply_markup=${keyboard}`;
    const result = await fetch(url);
    const resp = await result.json() as TelegramResponse;

    if (result.status !== 200)
        reportError(new Error(JSON.stringify(resp)), "sendToTelegram");

    return resp;
}

export async function sendPhotoWithCaption(
    chatId: string,
    imageUrl: string,
    caption: string
): Promise<TelegramResponse | undefined> {
    if (!imageUrl || isEmptyMessage(caption))
        return;

    const API_KEY = Deno.env.get("TELEGRAM_BOT_TOKEN");
    
    // For sendPhoto, we use HTML parse mode as it's more reliable with captions
    const escapedCaption = encodeURIComponent(caption);
    
    const url = `https://api.telegram.org/bot${API_KEY}/sendPhoto?chat_id=${chatId}&photo=${encodeURIComponent(imageUrl)}&caption=${escapedCaption}&parse_mode=HTML`;
    
    const result = await fetch(url);
    const resp = await result.json() as TelegramResponse;

    if (result.status !== 200) {
        reportError(new Error(JSON.stringify(resp)), "sendPhotoWithCaption");
        console.error(JSON.stringify(resp), JSON.stringify({ imageUrl, caption }));
    }

    return resp;
}


function splitMessage(text: string, maxLength: number = 3900): string[] {
    const pages: string[] = [];
    let currentPage = '';

    text.split(' ').forEach(word => {

        if ((currentPage + word).length + 1 > maxLength) {
            pages.push(currentPage.trim());
            currentPage = `${word} `;
        } else {
            currentPage += `${word} `;
        }
    });

    // Add the last page if there's remaining text
    if (currentPage.trim().length > 0) {
        pages.push(currentPage.trim());
    }

    return pages;
}

function escape(input: string): string {
    return input
        .replace(/\./g, '\\.')
        .replace(/\|/g, '\\|')
        .replace(/\)/g, '\\)')
        .replace(/\(/g, '\\(')
        .replace(/=/g, '\\=')
        .replace(/!/g, '\\!')
        .replace(/#/g, '\\#')
        .replace(/\+/g, '\\+')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}')
        .replace(/>/g, '\\>')       
        .replace(/-/g, '\\-');
}

function escapeTelegramText(text: string, mode: EscapeMode = 'Markdown'): string {
    const firstExcaping = escape(text);
    const urlEncodedText = encodeURIComponent(firstExcaping);

    if (mode === 'Markdown') {
        // Escape special Markdown characters
        return urlEncodedText
            .replace(/_/g, '\\_')
            .replace(/\*/g, '\\*')
            .replace(/\[/g, '\\[')
            .replace(/`/g, '\\`');
    } else if (mode === 'HTML') {
        // Escape special HTML characters
        return urlEncodedText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    return urlEncodedText; // Default case (no extra escaping for plain text)
}

function isEmptyMessage(text: string): boolean {
    return text.replace(/\s+/g, '').length === 0;
}