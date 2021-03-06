/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
/*eslint-disable @typescript-eslint/explicit-module-boundary-types*/

import { MessageType, Mimetype } from "@adiwajshing/baileys";
import { Sticker, Categories, StickerTypes } from "wa-sticker-formatter";
import MessageHandler from "../../Handlers/MessageHandler";
import BaseCommand from "../../lib/BaseCommand";
import WAClient from "../../lib/WAClient";
import { IParsedArgs, ISimplifiedMessage } from "../../typings";
import fs from "fs";
import { tmpdir } from "os";
import { exec } from "child_process";
import { promisify } from "util";
export default class Command extends BaseCommand {
	exe() {
		throw new Error("Method not implemented.");
	}
	constructor(client: WAClient, handler: MessageHandler) {
		super(client, handler, {
			command: "steal",
			aliases: ["take"],
			description: "Will format the given sticker.",
			category: "media",
			usage: `${client.config.prefix}steal[tag_sticker]|pack|author`,
			baseXp: 30,
		});
	}

	run = async (
		M: ISimplifiedMessage,
		parsedArgs: IParsedArgs
	): Promise<void> => {
		let buffer;
		if (M.quoted?.message?.message?.stickerMessage)
			buffer = await this.client.downloadMediaMessage(M.quoted.message);
		if (!buffer)
			return void M.reply(`Provide a sticker to format, โ๏ธ๐`);
			const pack = parsedArgs.joined.split("|");
			if (!pack[1])
				return void M.reply(
					`Please provide the new name and author of the sticker.\nExample: ${this.client.config.prefix}steal | By | The Great M_D ๐คนโโ๏ธ`
				);
			const filename = `${tmpdir()}/${Math.random().toString(36)}`;
			const getQuality = (): number => {
				const qualityFlag = parsedArgs.joined.match(/--(\d+)/g) || "";
				return qualityFlag.length
					? parseInt(qualityFlag[0].split("--")[1], 10)
					: parsedArgs.flags.includes("--broke")
					? 1
					: parsedArgs.flags.includes("--low")
					? 10
					: parsedArgs.flags.includes("--high")
					? 100
					: 50;
			};

			let quality = getQuality();
			if (quality > 100 || quality < 1) quality = 50;

			parsedArgs.flags.forEach(
				(flag) => (parsedArgs.joined = parsedArgs.joined.replace(flag, ""))
			);
			const getOptions = () => {
				const categories = (() => {
					const categories = parsedArgs.flags.reduce((categories, flag) => {
						switch (flag) {
							case "--angry":
								categories.push("๐ข");
								break;
							case "--love":
								categories.push("๐");
								break;
							case "--sad":
								categories.push("๐ญ");
								break;
							case "--happy":
								categories.push("๐");
								break;
							case "--greet":
								categories.push("๐");
								break;
							case "--celebrate":
								categories.push("๐");
								break;
						}
						return categories;
					}, new Array<Categories>());
					categories.length = 2;
					if (!categories[0]) categories.push("โค", "๐น");
					return categories;
				})();
				return {
					categories,
					pack: pack[1],
					author: pack[2] || `${M.sender.username}`,
					quality,
					type: StickerTypes[
						parsedArgs.flags.includes("--crop") ||
						parsedArgs.flags.includes("--c")
							? "CROPPED"
							: parsedArgs.flags.includes("--stretch") ||
							  parsedArgs.flags.includes("--s")
							? "DEFAULT"
							: "FULL"
					],
				};
			};
			parsedArgs.flags.forEach(
				(flag) => (parsedArgs.joined = parsedArgs.joined.replace(flag, ""))
			);
			const sticker: any = await new Sticker(buffer, getOptions()).build();
			fs.writeFileSync(`${filename}.webp`, sticker);
			const stickerbuffer = fs.readFileSync(`${filename}.webp`);
		await M.reply(stickerbuffer, MessageType.sticker, Mimetype.webp);
	};
}
