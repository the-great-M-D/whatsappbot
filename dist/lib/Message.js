"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSimplifiedMessage = void 0;
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
function buildSimplifiedMessage(msg, client) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const key = msg.key;
            const from = key.remoteJid;
            if (!from)
                return null;
            const isGroup = from.endsWith('@g.us');
            const chat = isGroup ? 'group' : 'dm';
            const senderJid = isGroup
                ? (key.participant || msg.participant || '')
                : (key.fromMe ? (((_a = client.user) === null || _a === void 0 ? void 0 : _a.id) || '') : from);
            const m = msg.message;
            if (!m)
                return null;
            const actualMessage = ((_b = m.ephemeralMessage) === null || _b === void 0 ? void 0 : _b.message) ||
                ((_c = m.viewOnceMessage) === null || _c === void 0 ? void 0 : _c.message) ||
                ((_d = m.viewOnceMessageV2) === null || _d === void 0 ? void 0 : _d.message) ||
                m;
            const getContent = () => {
                var _a, _b, _c, _d, _e;
                if (actualMessage.conversation)
                    return actualMessage.conversation;
                if ((_a = actualMessage.extendedTextMessage) === null || _a === void 0 ? void 0 : _a.text)
                    return actualMessage.extendedTextMessage.text;
                if ((_b = actualMessage.imageMessage) === null || _b === void 0 ? void 0 : _b.caption)
                    return actualMessage.imageMessage.caption;
                if ((_c = actualMessage.videoMessage) === null || _c === void 0 ? void 0 : _c.caption)
                    return actualMessage.videoMessage.caption;
                if ((_d = actualMessage.buttonsResponseMessage) === null || _d === void 0 ? void 0 : _d.selectedDisplayText)
                    return actualMessage.buttonsResponseMessage.selectedDisplayText;
                if ((_e = actualMessage.listResponseMessage) === null || _e === void 0 ? void 0 : _e.title)
                    return actualMessage.listResponseMessage.title;
                return '';
            };
            const content = getContent();
            const args = content.trim().split(/\s+/).filter(Boolean);
            const contextInfo = ((_e = actualMessage.extendedTextMessage) === null || _e === void 0 ? void 0 : _e.contextInfo) ||
                ((_f = actualMessage.imageMessage) === null || _f === void 0 ? void 0 : _f.contextInfo) ||
                ((_g = actualMessage.videoMessage) === null || _g === void 0 ? void 0 : _g.contextInfo) ||
                ((_h = actualMessage.documentMessage) === null || _h === void 0 ? void 0 : _h.contextInfo) ||
                ((_j = actualMessage.stickerMessage) === null || _j === void 0 ? void 0 : _j.contextInfo) ||
                ((_k = actualMessage.audioMessage) === null || _k === void 0 ? void 0 : _k.contextInfo) ||
                {};
            const mentioned = contextInfo.mentionedJid || [];
            let groupMetadata = null;
            if (isGroup) {
                try {
                    const raw = yield client.fetchGroupMetadataFromWA(from);
                    if (raw) {
                        groupMetadata = Object.assign(Object.assign({}, raw), { admins: raw.participants
                                .filter((p) => p.admin || p.superAdmin)
                                .map((p) => p.id) });
                    }
                }
                catch ( /* ignore */_p) { /* ignore */ }
            }
            const senderIsAdmin = (_m = (_l = groupMetadata === null || groupMetadata === void 0 ? void 0 : groupMetadata.admins) === null || _l === void 0 ? void 0 : _l.includes(senderJid)) !== null && _m !== void 0 ? _m : false;
            const contact = client.contacts[senderJid] || {};
            const senderUsername = msg.pushName || contact.notify || contact.name || senderJid.split('@')[0];
            let quoted = null;
            if ((contextInfo === null || contextInfo === void 0 ? void 0 : contextInfo.quotedMessage) && contextInfo.stanzaId) {
                quoted = {
                    message: {
                        key: {
                            remoteJid: from,
                            id: contextInfo.stanzaId,
                            participant: contextInfo.participant,
                            fromMe: contextInfo.participant === ((_o = client.user) === null || _o === void 0 ? void 0 : _o.id)
                        },
                        message: contextInfo.quotedMessage
                    },
                    sender: contextInfo.participant || (isGroup ? null : from)
                };
            }
            const urls = content.match(URL_REGEX) || [];
            const msgType = Object.keys(actualMessage)[0] || 'text';
            const simplified = {
                type: msgType,
                content,
                args: args.length ? args : [''],
                mentioned,
                groupMetadata,
                chat,
                from,
                sender: {
                    jid: senderJid,
                    username: senderUsername,
                    isAdmin: senderIsAdmin
                },
                quoted,
                WAMessage: msg,
                urls,
                reply: (replyContent, msgTypeArg, mime, mention, caption, _thumbnail) => __awaiter(this, void 0, void 0, function* () {
                    const typeStr = String(msgTypeArg || (Buffer.isBuffer(replyContent) ? 'document' : 'text'));
                    const mentions = mention || [];
                    if (Buffer.isBuffer(replyContent)) {
                        if (typeStr === 'sticker') {
                            return client.sock.sendMessage(from, { sticker: replyContent }, { quoted: msg });
                        }
                        if (typeStr === 'image') {
                            return client.sock.sendMessage(from, Object.assign({ image: replyContent, caption: caption || '', mimetype: mime || 'image/jpeg' }, (mentions.length ? { mentions } : {})), { quoted: msg });
                        }
                        if (typeStr === 'video' || typeStr === 'gif') {
                            return client.sock.sendMessage(from, Object.assign({ video: replyContent, caption: caption || '', gifPlayback: typeStr === 'gif' || mime === 'video/mp4', mimetype: mime || 'video/mp4' }, (mentions.length ? { mentions } : {})), { quoted: msg });
                        }
                        if (typeStr === 'audio') {
                            return client.sock.sendMessage(from, {
                                audio: replyContent,
                                mimetype: mime || 'audio/mp4',
                                ptt: false
                            }, { quoted: msg });
                        }
                        return client.sock.sendMessage(from, {
                            document: replyContent,
                            mimetype: mime || 'application/octet-stream',
                            fileName: 'file'
                        }, { quoted: msg });
                    }
                    return client.sock.sendMessage(from, Object.assign({ text: String(replyContent) }, (mentions.length ? { mentions } : {})), { quoted: msg });
                })
            };
            return simplified;
        }
        catch (err) {
            client.log(`Error building message: ${err.message}`, true);
            return null;
        }
    });
}
exports.buildSimplifiedMessage = buildSimplifiedMessage;
