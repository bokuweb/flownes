	; 横スクロールサンプル

	; INESヘッダー
	.inesprg 1 ;   - プログラムにいくつのバンクを使うか。今は１つ。
	.ineschr 1 ;   - グラフィックデータにいくつのバンクを使うか。今は１つ。
	.inesmir 1 ;   - VRAMのミラーリングを垂直にする
	.inesmap 0 ;   - マッパー。０番にする。

Scroll_X  = $00		; Xスクロール値

Floor_X    = $01	; 描画する縦ラインのX座標
Floor_Y    = $02	; 描画する床のY座標
Floor_Cnt  = $03	; 床更新待ちカウンター

Course_Index=$04 	; コーステーブルインデックス
Course_Cnt = $05 	; コース継続カウンター 

Walk_Cnt   = $06	; 歩きカウンター
Walk_Page  = $07	; 歩いているネームテーブル
Jump_Mode  = $08	; ジャンプ中？(1ならジャンプ中)
Jump_VY    = $09	; ジャンプ加速度
Jump_NL    = $0A	; ジャンプ当たり判定用のネームテーブルアドレス(下位)
Jump_NH    = $0B	; ジャンプ当たり判定用のネームテーブルアドレス(上位)

NameTblNum = $0C	; ネームテーブル選択番号(0=$2000,1=$2400)

	.bank 1      	; バンク１
	.org $FFFA		; $FFFAから開始

	.dw mainLoop 	; VBlank割り込みハンドラ(1/60秒毎にmainLoopがコールされる)
	.dw Start    	; リセット割り込み。起動時とリセットでStartに飛ぶ
	.dw IRQ			; ハードウェア割り込みとソフトウェア割り込みによって発生

	.bank 0			; バンク０

	.org $0300	 ; $0300から開始、スプライトDMAデータ配置
Sprite1_Y:     .db  0   ; スプライト#1 Y座標
Sprite1_T:     .db  0   ; スプライト#1 ナンバー
Sprite1_S:     .db  0   ; スプライト#1 属性
Sprite1_X:     .db  0   ; スプライト#1 X座標

	.org $8000	 ; $8000から開始
Start:
	sei			; 割り込み不許可
	cld			; デシマルモードフラグクリア
	ldx #$ff
	txs			; スタックポインタ初期化 

	; PPUコントロールレジスタ1初期化
	lda #%00110000	; ここではVBlank割り込み禁止
	sta $2000

waitVSync:
	lda $2002		; VBlankが発生すると、$2002の7ビット目が1になる
	bpl waitVSync	; bit7が0の間は、waitVSyncラベルの位置に飛んでループして待ち続ける


	; PPUコントロールレジスタ2初期化
	lda #%00000110	; 初期化中はスプライトとBGを表示OFFにする
	sta $2001

	; パレットをロード
	ldx #$00    ; Xレジスタクリア

	; VRAMアドレスレジスタの$2006に、パレットのロード先のアドレス$3F00を指定する。
	lda #$3F
	sta $2006
	lda #$00
	sta $2006

loadPal:			; ラベルは、「ラベル名＋:」の形式で記述
	lda tilepal, x ; Aに(ourpal + x)番地のパレットをロードする

	sta $2007 ; $2007にパレットの値を読み込む

	inx ; Xレジスタに値を1加算している

	cpx #32 ; Xを32(10進数。BGとスプライトのパレットの総数)と比較して同じかどうか比較している	
	bne loadPal ;	上が等しくない場合は、loadpalラベルの位置にジャンプする
	; Xが32ならパレットロード終了

	; 属性(BGのパレット指定データ)をロード
	lda #0
	sta <NameTblNum
	; $23C0,27C0の属性テーブルにロードする
	lda #$23
	sta $2006
	lda #$C0
	sta $2006
	jmp loadAttribSub
loadAttrib:
	lda #1
	sta <NameTblNum
	lda #$27
	sta $2006
	lda #$C0
	sta $2006
loadAttribSub:
	ldx #$00    		; Xレジスタクリア
	lda #%00000000		; ４つともパレット0番
	; 0番にする
.loadAttribSub2
	sta $2007			; $2007に属性の値($0)を読み込む
	; 64回(全キャラクター分)ループする
	inx
	cpx #64
	bne .loadAttribSub2
	lda <NameTblNum
	beq loadAttrib

	; ネームテーブル生成
	lda #0
	sta <NameTblNum
	; ネームテーブルの$2000から生成する
	lda #$20
	sta $2006
	lda #$00
	sta $2006
	jmp loadNametable1
loadNametable:
	; ネームテーブルの$2400から生成する
	lda #1
	sta <NameTblNum
	lda #$24
	sta $2006
	lda #$00
	sta $2006
loadNametable1:
	lda #$00        ; 0番(透明)
	; 112*8=896回出力する
	ldx #112		; Xレジスタ初期化
	ldy #8			; Yレジスタ初期化
.loadNametable2
	sta $2007		; $2007に書き込む
	dex
	bne .loadNametable2
	ldx #112		; Xレジスタ初期化
	dey
	bne .loadNametable2
	; 64回出力する
	lda #$01        ; 1番(地面)
	ldx #64			; Xレジスタ初期化
loadNametable3:
	sta $2007		; $2007に書き込む
	dex
	bne loadNametable3
	lda <NameTblNum
	beq loadNametable

	; スプライトDMA領域初期化(すべて0にする)
	lda #0
	ldx #$00
initSpriteDMA:
	sta $0300, x
	inx
	bne initSpriteDMA

	; スプライト座標初期化
	lda X_Pos_Init
	sta Sprite1_X
	sta Walk_Cnt	; 歩きカウンターも同じ値を設定
	lda Y_Pos_Init
	sta Sprite1_Y
	lda #2			; スプライト2番
	sta Sprite1_T

	; ゼロページ初期化
	lda #$00
	ldx #$00
initZeroPage:
	sta <$00, x
	inx
	bne initZeroPage

	lda Sprite1_X
	sta Walk_Cnt	; 歩きカウンターもX座標と同じ値を設定
	
	; PPUコントロールレジスタ2初期化
	lda #%00011110	; スプライトとBGの表示をONにする
	sta $2001

	; PPUコントロールレジスタ1の割り込み許可フラグを立てる
	lda #%10110101				; スプライトは8x16、ネームテーブルは$2400を指定、PPUアドレスインクリメントを+32にする
	sta $2000

infinityLoop:					; VBlank割り込み発生を待つだけの無限ループ
	jmp infinityLoop

mainLoop:					; メインループ

calcCourse:
	; 床描画判定(4周に1度、画面外に床を描画する)
	lda <Floor_Cnt
	cmp #4
	bne spriteDMA		; 床カウンタが4でないならまだ床を描画しない
	lda #0
	sta <Floor_Cnt		; 床カウンタクリア

	; Courseテーブル読み込み
	lda <Course_Cnt
	bne writeFloor		; まだカウント中
	ldx <Course_Index
	lda Course_Tbl, x	; Courseテーブルの値をAに読み込む
	sta <Floor_Y		; 床Y座標格納
	inc <Course_Index	; インデックス加算
	ldx <Course_Index
	lda Course_Tbl, x	; Courseテーブルの値をAに読み込む
	sta <Course_Cnt		; 床カウンタ格納
	inc <Course_Index	; インデックス加算
	lda <Course_Index
	cmp #20				; コーステーブル20回分ループする
	bne writeFloor
	lda #0				; インデックスを0に戻す
	sta <Course_Index

	; ネームテーブルに床を描画する
writeFloor:
	lda $2002			; PPUレジスタクリア
	dec <Course_Cnt		; コースカウンタ減算
	lda #$20			; ネームテーブルの上位アドレス($2000から)
	ldx <NameTblNum
	cpx #1				; ネームテーブル選択番号が1なら$2400から
	bne .writeFloorE
	lda #$24			; ネームテーブルの上位アドレス($2400から)
.writeFloorE
	sta $2006			; ネームテーブル上位アドレスをセット
	lda <Floor_X		; 床X座標をロード(そのまま下位アドレスになる)
	sta $2006
	ldx #28				; 縦28回分ループする(地面が2キャラあるので30-2)
.writeFloorSub
	lda #$00			; 0番(透明)
	cpx <Floor_Y
	bne .writeFloorSub2	; 床のY座標と違うならwriteFloorSub2へ
	lda #$02			; 2番(レンガ)
.writeFloorSub2
	sta $2007
	dex
	bne .writeFloorSub	; 28回ループする

	inc <Floor_X		; 床X座標加算
	lda <Floor_X
	cmp #32				; ネームテーブルのライン右端に到達した？
	bne spriteDMA
	lda #0				; 0に戻す
	sta <Floor_X
	; ネームテーブル選択番号を切り替える
	lda <NameTblNum
	eor #1				; ビット反転
	sta <NameTblNum

spriteDMA:
	; スプライト描画(DMAを利用)
	lda #$3  ; スプライトデータは$0300番地からなので、3をロードする。
	sta $4014 ; スプライトDMAレジスタにAをストアして、スプライトデータをDMA転送する
	
	; 歩きアニメーション(2番と4番を交互に)
	lda <Walk_Cnt		; 歩きカウンターをロード
	and #8				; 3ビット目を取得
	lsr a				; 右シフトで半分に
	lsr a				; 右シフトで半分に
	clc					; Cフラグクリア
	adc #2				; Aに2加算
	sta Sprite1_T		; スプライト番号に設定

	lda <Jump_Mode
	beq startIsHitBlock	; ジャンプ中ではない

startIsHitBlock:
	; 床との当たり判定
	lda $2002			; PPUレジスタクリア

	lda <Jump_VY
	bmi addPreGrav		; まだ上昇中

	lda #$20
	ldx <Walk_Page
	beq isHitBlock		; 0ならネームテーブルアドレス上位は$2000
	lda #$24
isHitBlock:
	sta <Jump_NH

	lda Sprite1_Y
	lsr a				; 1/8にする
	lsr a
	lsr a
	tax
	inx					; 見る場所はスプライトの足元のY座標なので加算する
	inx
	lda #0
.isHitBlock2
	clc
	adc #32
	bcc .isHitBlock3		; 桁上がり無しなら
	inc <Jump_NH		; 桁上がりしたので上位アドレス加算
.isHitBlock3
	dex
	bne .isHitBlock2	; Y座標の数だけループ
	sta <Jump_NL		; 下位アドレスにストア
	lda <Jump_NH		; ネームテーブル上位アドレスをセット
	sta $2006
	lda Walk_Cnt		; Walk_Cntをの1/8が下位アドレス
	lsr a				; 1/8にする
	lsr a
	lsr a
	clc
	adc <Jump_NL		; 下位アドレス加算
	sta $2006
	lda $2007			; スプライトの足元のBGキャラクターを取得する
	beq	.isHitBlock4	; 0なら足の地点が床に当たっていない
	lda <Jump_Mode
	beq setBGScroll	; ジャンプしてないならそのまま

	lda #0				; 加速度クリア
	sta <Jump_VY
	lda Sprite1_Y		; Y座標補正
	and #$f8
	sta Sprite1_Y
	dec <Jump_Mode		; ジャンプモード終了
	jmp setBGScroll
.isHitBlock4
	lda <Jump_Mode
	bne addGrav			; すでにジャンプ中ならそのまま
	lda #0				; 加速度クリア
	sta <Jump_VY
	inc <Jump_Mode		; 落下開始

addPreGrav:
	; ジャンプ直後、1回だけ$2007を初期化する
	lda <Jump_VY
	cmp #$F4		; ジャンプ加速度初期値と同じか？
	bne addGrav
	lda $2002		; VRAMレジスタ初期化
	lda #$20
	sta $2006
	sta $2006
	lda $2007
addGrav:

	; ジャンプ加速度加算
	lda Sprite1_Y
	clc
	adc <Jump_VY		; ジャンプY加速度加算
	sta Sprite1_Y

	; ジャンプ加速度に重力加算
	inc <Jump_VY
	; 重力加速度リミッター
	lda <Jump_VY
	cmp #5				; 最大4
	bne setBGScroll
	dec <Jump_VY

setBGScroll:
	; BGスクロール(このタイミングで実行する)
	lda $2002			; スクロール値クリア
	lda <Scroll_X		; Xのスクロール値をロード
	sta $2005			; X方向スクロール
	lda #0
	sta $2005			; Y方向スクロール（Y方向は固定)

	; 表示するネームテーブル番号(bit1~0)をセットする
	; PPUアドレスインクリメントは+32にする
	lda #%10110101				; ネームテーブル$2400を指定
	ldx <NameTblNum
	bne setNameTblNum
	lda #%10110100				; ネームテーブル$2000を指定
setNameTblNum:
	sta $2000

	; パッドI/Oレジスタの準備
	lda #$01
	sta $4016
	lda #$00
	sta $4016

	; パッド入力チェック
	lda $4016  ; Aボタンをスキップ
	and #1     ; AND #1
	bne AKEYdown ; 0でないならば押されてるのでAKeydownへジャンプ	
isBKEYdown:
	lda $4016  ; Bボタンをスキップ
	lda $4016  ; Selectボタンをスキップ
	lda $4016  ; Startボタンをスキップ
	lda $4016  ; 上ボタン
	lda $4016  ; 下ボタン
	lda $4016  ; 左ボタン
	and #1     ; AND #1
	bne LEFTKEYdown ; 0でないならば押されてるのでLEFTKeydownへジャンプ
	lda $4016  ; 右ボタン
	and #1     ; AND #1
	bne RIGHTKEYdown ; 0でないならば押されてるのでRIGHTKeydownへジャンプ
	jmp NOTHINGdown  ; なにも押されていないならばNOTHINGdownへ

AKEYdown:
	; ジャンプ
	lda <Jump_Mode
	bne isBKEYdown	; 0以外なら現在ジャンプ中
	lda #$F4		; ジャンプ加速度
	sta <Jump_VY
	inc <Jump_Mode	; ジャンプモードに
	jmp isBKEYdown	; 左右入力も受け付ける

LEFTKEYdown:
	jsr moveLeft
	jmp NOTHINGdown
RIGHTKEYdown:
	jsr moveRight
NOTHINGdown:

	rti				; 割り込みから復帰

IRQ:
	rti

moveRight:
	; 右移動
	clc
	lda <Walk_Cnt
	adc #2
	sta <Walk_Cnt
	bcc .moveRightSub	; 桁上がりしたらネームテーブル切り替え
	lda <Walk_Page
	eor #1
	sta <Walk_Page
.moveRightSub
	lda #0
	sta Sprite1_S	; 右を向く
	lda Sprite1_X
	cmp #120		; 画面中央か？
	beq .moveRightSub2
	inc Sprite1_X	; スプライトX座標を加算
	inc Sprite1_X	; スプライトX座標を加算
	rts
.moveRightSub2
	inc <Scroll_X	; スクロールX座標を加算
	inc <Scroll_X	; スクロールX座標を加算
	inc Floor_Cnt	; 床カウンター加算
	rts

moveLeft:
	; 左移動
	lda #%01000000
	sta Sprite1_S		; 左を向く
	lda Sprite1_X
	beq .moveLeftSub	; 座標0なら減算しない
	dec Sprite1_X		; スプライトX座標を減算
	dec Sprite1_X		; スプライトX座標を減算
	sec
	lda <Walk_Cnt
	sbc #2
	sta <Walk_Cnt
	bcs .moveLeftSub	; 桁下がりしたらネームテーブル切り替え
	lda <Walk_Page
	eor #1
	sta <Walk_Page
.moveLeftSub
	rts

	; 初期データ
X_Pos_Init   .db 120      ; X座標初期値
Y_Pos_Init   .db 208      ; Y座標初期値

	; 背景データ(10x2個・Y座標・継続カウンタ)
Course_Tbl    .db 3,4,5,10,8,10,3,10,6,5,9,10,12,15,7,8,10,10,5,6

tilepal: .incbin "giko5.pal" ; パレットをincludeする

	.bank 2       ; バンク２
	.org $0000    ; $0000から開始

	.incbin "giko3.spr"  ; スプライトデータのバイナリィファイルをincludeする
	.incbin "giko5.bkg"  ; 背景データのバイナリィファイルをincludeする