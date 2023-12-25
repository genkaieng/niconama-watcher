import path from 'path';
import puppeteer from "puppeteer-extra";
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import ffmpeg from "fluent-ffmpeg";

// 監視するユーザーID
const userId = "83050000"; // 限界園児

// 動画を出力するディレクトリ
const dir = "videos"

const main = () => {
  Process.run();
}

namespace Process {
  export async function run() {
    let lastLvID: string | undefined = undefined;
    console.log('================START================');

    console.log('新しい配信をチェック')

    const lvID = await checkLiveAndRecord(lvID => lvID !== lastLvID);
    if (lvID) {
      lastLvID = lvID;
    }

    console.log('=================END=================');

    await wait(5 * 60 * 1000);
    await run();
  }
}

const checkLiveAndRecord = async (isNewLvID: (lastLvID: string | undefined) => boolean): Promise<string | undefined> => {
  const baseUrl = "https://www.nicovideo.jp/user/";

  const browser = await puppeteer.use(StealthPlugin()).launch();
  const page = await browser.newPage();
  await page.goto(baseUrl + userId);

  const lastLvLink = (await page.$$('article.NicorepoItem-item > div.NicorepoItem-body > a'))?.[0];
  const lastLvUrl = await lastLvLink?.evaluate(e => e.href);
  const lastLvID = lastLvUrl?.match(/lv\d+/)?.[0];
  if (!isNewLvID(lastLvID)) {
    // 新しい配信が見つからなかった場合ブラウザを閉じて終了
    await browser.close();
    return lastLvID;
  }
  console.log('lv:', lastLvID);

  let isRecording = false;

  page.on("response", async (response): Promise<void> => {
    const url = response.url();
    const headers = response.headers();

    if (headers["content-type"] === "application/vnd.apple.mpegurl" && url.includes("playlist.m3u8")) {
      if (isRecording) return;
      console.log(url, headers);
      const text = await response.text();
      console.log(text);

      saveToMp4(url, path.join(dir, `${lastLvID}.mp4`), () => { isRecording = false });
      isRecording = true;

      console.log("新しい配信が見つかりました。")
    }
  });
  // 新しい配信が見つかった場合配信ページに飛んで録画を開始
  await lastLvLink.click();

  await wait(60 * 1000, () => isRecording);

  // 録画が終了したらブラウザを閉じる
  await browser.close();

  return lastLvID;
}

const wait = (interval: number, isRecording?: () => boolean) => new Promise<void>(resolve => {
  const loop = () => {
    setTimeout(() => {
      isRecording?.() ? loop() : resolve();
    }, interval);
  }
  loop();
});

const saveToMp4 = (source: string, output: string, onComplete?: () => void) => {
  ffmpeg(source)
    .output(output)
    .videoCodec('copy') // ビデオコーデックをコピー
    .audioCodec('copy') // オーディオコーデックをコピー
    .outputOptions('-bsf:a', 'aac_adtstoasc') // オーディオビットストリームフィルタ
    // .duration(30)
    .on('end', () => {
      console.info("録画終了 🎉");
      onComplete?.();
    })
    .on('codecData', (data) => {
      Logger.log(data);
    })
    .on('progress', (progress) => {
      Logger.log(progress);
    })
    .on('error', (err) => {
      console.error("エラーが発生しました", err);
      onComplete?.();
    })
    .run()
}

namespace Logger {
  export function log(obj: any) {
    const s = Object.keys(obj).reduce<string[]>((acc, key) => {
      return [...acc, `${key}: ${obj[key]}`]
    }, []).join('\n');
    console.log(s + '\n');
  }
}

main();
