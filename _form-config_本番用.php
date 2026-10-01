<?php
/*
 * J-DRY 自前フォームの設定（本番用）— 2026-10-01 判定役
 *   元＝C:\HQ\templates\form-php\form-config.php（水野谷の見本）。make-honban.sh が本番セットへ form-config.php として入れる。
 *   ★先頭が _ なので GitHub Pages の制作版には出ない（Jekyll が _ 始まりを配信しない）。
 *   🔴 'to' は社長確認待ち＝miegarden8989@gmail.com が「J-DRY様ご本人の、今も読んでいる受信箱」かを確かめてから使う。
 *      根拠は 2026-09 以前の会話記録の一文のみ（「miegarden8989@gmail.com がj－dryさんのアドレス」）。
 *      make-honban.sh は FORM_TO_CONFIRMED=1 を付けて流さない限り🔴で止まる。
 */
return [
    'to'        => 'miegarden8989@gmail.com',
    // 送信元＝お客様ドメイン。★切替時に SPF へ include:spf.sender.xserver.jp を足す（入れ替え準備_2026-10-01.md §5）
    'from'      => 'form@j-dry.com',
    'site_name' => 'J-DRY',
    'site_url'  => 'https://j-dry.com/contact.html',
    'subject'   => '【J-DRY ホームページ】お問い合わせが届きました',
    'allowed_hosts' => ['j-dry.com', 'www.j-dry.com'],
    'thanks_url' => '',
    'reply_field' => 'email',
    'log_dir'   => dirname(__DIR__) . '/form-log',
    // contact.html の欄（name / email / subject / message）と同じ名前・同じ必須
    'fields' => [
        'name'    => ['label' => 'お名前',         'required' => true,  'max' => 100],
        'email'   => ['label' => 'メールアドレス', 'required' => true,  'max' => 200],
        'subject' => ['label' => 'タイトル',       'required' => false, 'max' => 120],
        'message' => ['label' => 'メッセージ',     'required' => true,  'max' => 5000, 'multiline' => true],
    ],
];
