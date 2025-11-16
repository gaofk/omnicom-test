import React, { useEffect, useState } from "react";
import liff from "@line/liff";

const jobs = [
  {
    id: 1,
    title: "フロントエンドエンジニア",
    description: "React / Vue を用いた Web アプリケーション開発。",
    detail: "JavaScript / TypeScript を用いた SPA 開発経験がある方を募集します。",
  },
  {
    id: 2,
    title: "バックエンドエンジニア",
    description: "API サーバー、バッチ処理などの設計・開発。",
    detail: "Node.js / Java / PHP などいずれかのバックエンド開発経験がある方。",
  },
  {
    id: 3,
    title: "プロジェクトマネージャー",
    description: "開発プロジェクトの進行管理、顧客折衝。",
    detail: "システム開発案件の PM / PL 経験がある方。",
  },
  {
    id: 4,
    title: "QAエンジニア",
    description: "Web / モバイルアプリのテスト設計・実施。",
    detail: "テスト計画・テスト設計の経験がある方。",
  },
];

function App() {
  const [initialized, setInitialized] = useState(false);
  const [profile, setProfile] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // 好友状态：null = 还没查到；true = 已关注；false = 未关注
  const [isFriend, setIsFriend] = useState(null);
  const addFriendUrl = import.meta.env.VITE_LINE_ADD_FRIEND_URL;

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const userProfile = await liff.getProfile();
        setProfile(userProfile);

        // 只在 LINE 客户端里才能用 getFriendship
        if (liff.isInClient()) {
          try {
            const friendship = await liff.getFriendship();
            setIsFriend(friendship.friendFlag); // true: 已经关注公式账号
          } catch (e) {
            console.error("getFriendship error:", e);
            // 出错时为了不影响测试，默认允许选择
            setIsFriend(true);
          }
        } else {
          // 在外部浏览器调试时，就先允许选择
          setIsFriend(true);
        }

        setInitialized(true);
      } catch (error) {
        console.error("LIFF init error:", error);
        alert("LIFF の初期化に失敗しました。");
      }
    };

    initLiff();
  }, []);

  const selectedJob = jobs.find((job) => job.id === selectedJobId);

  const handleJobClick = (jobId) => {
    if (!isFriend) {
      // 未关注时不允许选择
      return;
    }
    setSelectedJobId(jobId);
  };

  const handleFollowClick = () => {
    if (!addFriendUrl) {
      alert("友だち追加用 URL が設定されていません。VITE_LINE_ADD_FRIEND_URL を確認してください。");
      return;
    }

    // 打开公式账号的「友だち追加」页面
    liff.openWindow({
      url: addFriendUrl,
      external: true, // 在外部浏览器打开
    });
  };

  const handleSend = async () => {
    if (!selectedJob || !profile) return;
    if (!isFriend) {
      alert("まず公式アカウントをフォローしてください。");
      return;
    }

    setIsSending(true);
    try {
      // 这里会在「公式アカウント ↔ 用户」聊天里发送两条消息：
      // 1) [APPLY] 开头的技术用消息 → 给 Webhook 用来识别职位
      // 2) 详细的応募内容 → 给运营/HR 查看
      await liff.sendMessages([
        {
          type: "text",
          text: `[APPLY] ${selectedJob.title}`,
        },
        {
          type: "text",
          text:
            "【採用応募がありました】\n" +
            "応募者: " +
            profile.displayName +
            "\n" +
            "職種: " +
            selectedJob.title +
            "\n\n" +
            "概要: " +
            selectedJob.description +
            "\n" +
            "詳細: " +
            selectedJob.detail +
            "\n\n" +
            "※このメッセージは LIFF 採用ページから送信されました。",
        },
      ]);

      alert("応募内容を送信しました。ありがとうございました。");
      // 在 LINE 客户端中关闭 LIFF 画面
      if (liff.isInClient()) {
        liff.closeWindow();
      }
    } catch (error) {
      console.error("sendMessages error:", error);
      alert("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      // 无论成功失败，都会把 loading 状态关掉
      setIsSending(false);
    }
  };

  const isJobSelectable = isFriend === true; // 只有已关注时才可选择

  if (!initialized || isFriend === null || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-sm">読み込み中です…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-4">
        <h1 className="text-xl font-bold mb-2 text-gray-800">採用エントリー</h1>
        <p className="text-sm text-gray-600 mb-4">
          LINE公式アカウントをフォローした上で、ご希望の募集職種を選択してください。
        </p>

        {/* 用户信息 */}
        <div className="mb-4 text-sm text-gray-700">
          <div>こんにちは、{profile.displayName} さん</div>
        </div>

        {/* 关注状态区域 */}
        <div className="mb-4 p-3 rounded-lg border border-gray-200 bg-gray-50">
          {isFriend ? (
            <div className="text-sm text-green-700">
              ✅ すでに公式アカウントをフォローしています。募集職種を選択して応募できます。
            </div>
          ) : (
            <div className="text-sm text-red-700">
              ⚠ まだ公式アカウントをフォローしていません。
              <br />
              「公式アカウントをフォローする」ボタンを押して友だち追加を行ってください。
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleFollowClick}
                  className="w-full py-2 px-3 rounded-lg text-white text-sm font-semibold bg-green-500 hover:bg-green-600"
                >
                  公式アカウントをフォローする
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 职位列表 */}
        <div className="space-y-3 mb-4">
          {jobs.map((job) => {
            const active = selectedJobId === job.id;
            const disabled = !isJobSelectable;
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => handleJobClick(job.id)}
                className={`w-full text-left border rounded-lg p-3 transition ${
                  disabled
                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                    : active
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-400"
                }`}
                disabled={disabled}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{job.title}</span>
                  {!disabled && active && (
                    <span className="text-xs text-green-600 font-semibold">選択中</span>
                  )}
                  {disabled && (
                    <span className="text-xs text-gray-400">フォローが必要</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 mb-1">{job.description}</div>
                <div className="text-[11px] text-gray-500">{job.detail}</div>
              </button>
            );
          })}
        </div>

        {/* 发送按钮 */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!selectedJob || !isFriend || isSending}
          className={`w-full py-2 px-3 rounded-lg text-white text-sm font-semibold ${
            !selectedJob || !isFriend || isSending
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isSending ? "送信中..." : "この内容で応募する"}
        </button>

        <p className="mt-3 text-[11px] text-gray-400">
          ※ 応募ボタンを押すと、あなたと公式アカウントのトークルームに応募内容が送信されます。
        </p>
      </div>
    </div>
  );
}

export default App;
