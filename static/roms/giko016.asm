	; 縦スクロールサンプル

	; INESヘッダー
	.inesprg 1 ;   - プログラムにいくつのバンクを使うか。今は１つ。
	.ineschr 1 ;   - グラフィックデータにいくつのバンクを使うか。今は１つ。
	.inesmir 0 ;   - VRAMのミラーリングを水平にする。
	.inesmap 0 ;   - マッパー。０番にする。

	; ゼロページ変数
Scroll_Y  = $00	; Yスクロール値

Road_X    = $01	; 道路のX座標
Road_YL   = $02	; 道路のY座標アドレス(下位)
Road_YH   = $03	; 道路のY座標アドレス(上位)
Road_Cnt  = $04	; 道路更新待ちカウンター

Course_Index=$05 ; コーステーブルインデックス
Course_Dir= $06  ; コース方向(0:直進1:左折2:右折)
Course_Cnt = $07 ; コース方向継続カウンター 

Crash_YH   = $08	; 衝突Y座標アドレス(上位)
Crash_YL   = $09	; 衝突Y座標アドレス(下位)

NameTblNum = $0A	; ネームテーブル選択番号(0=$2000,1=$2800)

	.bank 1      ; バンク１
	.org $FFFA   ; $FFFAから開始

	.dw mainLoop ; VBlank割り込みハンドラ(1/60秒毎にmainLoopがコールされる)
	.dw Start    ; リセット割り込み。起動時とリセットでStartに飛ぶ
	.dw IRQ      ; ハードウェア割り込みとソフトウェア割り込みによって発生

	.bank 0			 ; バンク０
	.org $0300	 ; $0300から開始、スプライトDMAデータ配置
Sprite1_Y:     .db  0   ; スプライト#1 Y座標
Sprite1_T:     .db  0   ; スプライト#1 ナンバー
Sprite1_S:     .db  0   ; スプライト#1 属性
Sprite1_X:     .db  0   ; スプライト#1 X座標
Sprite2_Y:     .db  0   ; スプライト#2 Y座標
Sprite2_T:     .db  0   ; スプライト#2 ナンバー
Sprite2_S:     .db  0   ; スプライト#2 属性
Sprite2_X:     .db  0   ; スプライト#2 X座標


	.org $8000	; $8000から開始
Start:
	sei			; 割り込み不許可
	cld			; デシマルモードフラグクリア
	ldx #$ff
	txs			; スタックポインタ初期化 

	; PPUコントロールレジスタ1初期化
	lda #%00001000	; ここではVBlank割り込み禁止
	sta $2000

waitVSync:
	lda $2002		; VBlankが発生すると、$2002の7ビット目が1になる
	bpl waitVSync	; bit7が0の間は、waitVSyncラベルの位置に飛んでループして待ち続ける

	; PPUコントロールレジスタ2初期化
	lda #%00000110	; 初期化中はスプライトとBGを表示OFFにする
	sta $2001

	; パレットをロード
	ldx #$00    	; Xレジスタクリア

	; VRAMアドレスレジスタの$2006に、パレットのロード先のアドレス$3F00を指定する。
	lda #$3F
	sta $2006
	lda #$00
	sta $2006

loadPal:			; ラベルは、「ラベル名＋:」の形式で記述
	lda tilepal, x	; Aに(ourpal + x)番地のパレットをロードする

	sta $2007 ; $2007にパレットの値を読み込む

	inx ; Xレジスタに値を1加算している

	cpx #32 	; Xを32(10進数。BGとスプライトのパレットの総数)と比較して同じかどうか比較している	
	bne loadPal ;	上が等しくない場合は、loadpalラベルの位置にジャンプする
	; Xが32ならパレットロード終了

	; 属性(BGのパレット指定データ)をロード
	lda #0
	sta <NameTblNum
	; $23C0,2BC0の属性テーブルにロードする
	lda #$23
	sta $2006
	lda #$C0
	sta $2006
	jmp loadAttribSub
loadAttrib:
	lda #1
	sta <NameTblNum
	lda #$2B
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
	jmp loadNametableSub
	; ネームテーブルの$2800から生成する
loadNametable:
	lda #1
	sta <NameTblNum
	lda #$28
	sta $2006
	lda #$00
	sta $2006
loadNametableSub:
	ldy #0
	lda #11		; 道路の初期X座標=11
	sta <Road_X
.loadNametableSub2
	jsr writeCourse
	iny
	cpy #30		; 30回繰り返す
	bne .loadNametableSub2
	lda <NameTblNum
	beq loadNametable

	; スプライトDMA領域初期化(0と1以外は全て奥にする)
	lda #%00100000
	ldx #$00
initSpriteDMA:
	sta $0300, x
	inx
	bne initSpriteDMA
	lda #0
	sta Sprite1_T
	sta Sprite1_S
	sta Sprite2_T

	; １番目のスプライト座標初期化
	lda X_Pos_Init
	sta Sprite1_X
	lda Y_Pos_Init
	sta Sprite1_Y
	; ２番目のスプライト座標更新サブルーチンをコール
	jsr setSprite2
	; ２番目のスプライトを水平反転
	lda #%01000000
	sta Sprite2_S

	; ゼロページ初期化
	lda #$00
	ldx #$00
initZeroPage:
	sta <$00, x
	inx
	bne initZeroPage
	
	lda #$23	; 道路のY座標アドレス初期化($23C0)
	sta <Road_YH
	lda #$C0
	sta <Road_YL
	lda #11		; 道路の初期X座標=11
	sta <Road_X

	; PPUコントロールレジスタ2初期化
	lda #%00011110	; スプライトとBGの表示をONにする
	sta $2001

	; PPUコントロールレジスタ1の割り込み許可フラグを立てる
	lda #%10001010
	sta $2000

infinityLoop:					; VBlank割り込み発生を待つだけの無限ループ
	jmp infinityLoop

mainLoop:					; メインループ

calcCourse:
	; 道路描画判定(4周に1度、画面外に道路を描画する)
	inc <Road_Cnt		; カウンタ増加
	lda <Road_Cnt
	cmp #4
	bne scrollBG		; 4でないならまだ道路を描画しない
	lda #0
	sta <Road_Cnt
	; 道路Y座標アドレス計算
	lda <Road_YL
	sec					; sbcの前にキャリーフラグをセット
	sbc #32				; 道路のY座標アドレス(下位)に32減算
	sta <Road_YL
	bcs setCourse		; 桁下がりしてなければsetCourseへ
	lda <Road_YH
	cmp #$20			; Y座標アドレス(上位)が$20まで下がったか？
	bne .calcCourseSub

	; ネームテーブル選択番号を更新
	lda <NameTblNum
	eor #1
	sta <NameTblNum

	lda #$23			; 道路のY座標アドレス初期化($23C0)
	sta <Road_YH
	lda #$C0
	sta <Road_YL
	lda #03				; 次回更新するために、カウンタは4-1=3
	sta <Road_Cnt
	jmp scrollBG		; 今回は更新しない
.calcCourseSub
	dec <Road_YH		; Y座標アドレスの上位は$23→$22→$21→$20→$23...
	
setCourse:
	; ネームテーブルのRoad_YH*$100+Road_YHに道路を1ライン描画する
	lda <Road_YH		; 上位アドレス

	ldx <NameTblNum
	beq .setCourseSub	; NameTblNumが0ならば$2000から更新する
	clc					; adcの前にキャリーフラグをクリア
	adc #8 				; NameTblNumが1ならば$2800から更新する
.setCourseSub
	sta $2006
	lda <Road_YL		; 下位アドレス
	sta $2006
	jsr writeCourse

	; 衝突判定
	jsr isCrash

scrollBG:
	; BGスクロール
	lda $2002			; スクロール値クリア
	lda #0
	sta $2005			; X方向は固定
	lda <Scroll_Y
	sta $2005			; Y方向スクロール
	dec <Scroll_Y		; スクロール値を減算
	dec <Scroll_Y		; スクロール値を減算
	cmp #254			; 254になった？
	bne sendSprite
	lda #238			; 16ドットスキップして238にする
	sta <Scroll_Y

sendSprite:
	; スプライト描画(DMAを利用)
	lda #$3  ; スプライトデータは$0300番地からなので、3をロードする。
	sta $4014 ; スプライトDMAレジスタにAをストアして、スプライトデータをDMA転送する

	; コース設定
    jsr goCourse

	; 表示するネームテーブル番号(bit1~0)をセットする
	lda #%10001000
	ldx <NameTblNum
	bne setNameTblNum
	ora #2			; (%10001010)ネームテーブル2番を表示する
setNameTblNum:
	sta $2000

getPad:
	; パッドI/Oレジスタの準備
	lda #$01
	sta $4016
	lda #$00
	sta $4016

	; パッド入力チェック
	lda $4016  ; Aボタン
	lda $4016  ; Bボタン
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

LEFTKEYdown:
	dec Sprite1_X	; X座標を1減算
	jmp NOTHINGdown

RIGHTKEYdown:
	inc Sprite1_X	; X座標を1加算
	; この後NOTHINGdownなのでジャンプする必要無し

NOTHINGdown:
	; ２番目のスプライト座標更新サブルーチンをコール
	jsr setSprite2
	
	; サウンド待ちカウンタA~D(ゼロページで連続した領域という前提)をそれぞれ-1減算する	
NMIEnd:
	rti				; 割り込みから復帰

setSprite2:
	; ２番目のスプライトの座標更新サブルーチン
	clc					;　adcの前にキャリーフラグをクリア
	lda Sprite1_X
	adc #8 				; 8ﾄﾞｯﾄ右にずらす
	sta Sprite2_X
	lda Sprite1_Y
	sta Sprite2_Y
	rts

	; 衝突判定
	; 道路のY座標アドレスを利用する
isCrash:
	ldy #0				; 桁下がりフラグ0
	lda <Road_YL		; 下位アドレス
	sec					; sbcの前にキャリーフラグをセット
	sbc #$C0			; 道路のY座標アドレス(下位)に$C0減算
	sta <Crash_YL
	bcs .isCrashSub2	; 桁下がりしてなければisCrashSub2へ
	lda <Road_YH
	sta <Crash_YH
	cmp #$20			; Y座標アドレス(上位)が$20まで下がったか？
	bne .isCrashSub
	ldy #1				; 桁下がりフラグ1
	lda #$24			; 道路のY座標アドレス初期化($24→$23)
	sta <Crash_YH
	lda <Crash_YL
	sec					; sbcの前にキャリーフラグをセット
	sbc #$40			; 道路のY座標アドレス(下位)に$40減算
	sta <Crash_YL
.isCrashSub
	dec <Crash_YH		; Y座標アドレス(上位)減算
.isCrashSub2
	lda <Crash_YH		; 上位アドレス

	; 桁下がりの場合は、もう片方のネームテーブルをチェックする
	ldx <NameTblNum		; XにNameTblNumをロード
	cpy #1				; 桁下がりフラグが1か？
	bne .isCrashSubE
	pha					; AをスタックにPUSH(上位アドレスを退避)
	txa					; X→A
	eor #1				; NameTblNumをビット反転
	tax					; A→X
	pla					; AにスタックからPULL(上位アドレスを復帰)
.isCrashSubE:
	cpx #0
	beq .isCrashSub3	; NameTblNumが0ならばネームテーブル$2000からチェックする
	clc					; adcの前にキャリーフラグをクリア
	adc #8 				; NameTblNumが1ならばネームテーブル$2800からチェックする
.isCrashSub3
	sta $2006
	lda Sprite2_X		; スプライトの中央座標をロード
	lsr a				; 右シフト3回で1/8
	lsr a
	lsr a
	clc
	adc <Crash_YL		; Y座標アドレス(下位)に加算
	sta $2006
	lda $2007			; Aにスプライト中心座標付近のBGを取得
	beq .isCrashEnd		; BG0番ならば道路なのでOK
	; 衝突したので赤くする
	; スプライトのパレット1番
	lda #1
	sta Sprite1_S
	lda #%01000001
	sta Sprite2_S
	rts	
.isCrashEnd
	; スプライトのパレット0番
	lda #0
	sta Sprite1_S
	lda #%01000000
	sta Sprite2_S
	rts

	; コースを進める
goCourse:
	lda <Road_Cnt
	beq .goCourseSub	; 待ち中なら更新しない
	rts
.goCourseSub
	lda <Course_Cnt
	bne .goCourseSub2	; まだカウント中
	ldx <Course_Index
	lda Course_Tbl, x	; Courseテーブルの値をAに読み込む
	pha					; AをPUSH
	and #$3				; bit0~1を取得
	sta <Course_Dir		; コース方向に格納
	pla					; AをPULLして戻す
	lsr a				; 左2シフトしてbit2~7を取得
	lsr a
	sta <Course_Cnt		; コースカウンターに格納
	inc <Course_Index
	lda <Course_Index
	cmp #10				; コーステーブル10回分ループする
	bne .goCourseSub2
	lda #0				; インデックスを0に戻す
	sta <Course_Index
.goCourseSub2
	lda <Course_Dir
	bne .goCourseLeft	; 0(直進)か？
	jmp .goCourseEnd
.goCourseLeft
	cmp #$01			; 1(左折)か？
	bne .goCourseRight
	dec <Road_X			; 道路X座標減算
	jmp .goCourseEnd
.goCourseRight
	inc <Road_X			; 2(右折)なので道路X座標加算
.goCourseEnd
	dec <Course_Cnt
	rts

	; BGに道路を１ライン描画する
writeCourse:
	; 左側の野原を描画
	ldx <Road_X
	lda #$01		; 左側の野原
.writeLeftField
	sta $2007		; $2007に書き込む
	dex
	cpx #1 
	bne .writeLeftField

	; 左側の路肩を描画
	lda <Course_Dir
	bne .writeLeftLeft	; 0(直進)か？
	lda #$02			; 左側の路肩(直進)
	jmp .writeLeftEnd
.writeLeftLeft
	cmp #$01			; 1(左折)か?
	bne .writeLeftRight
	sta $2007			; Road_Xが-1されてるので野原を1キャラ多く書き込む
	lda #$04			; 左側の路肩(左折)
	jmp .writeLeftEnd
.writeLeftRight
	lda #$06			; 左側の路肩(右折)
.writeLeftEnd
	sta $2007			; $2007に書き込む

	; 中央の道路を描画
	ldx #9				; 道幅=10だがここでは9
	lda #$00			; 道路
.writeRoad
	sta $2007			; $2007に書き込む
	dex
	bne .writeRoad


	; 右側の路肩を描画
	ldx <Course_Dir
	bne .writeRightLeft	; 0(直進)か？
	sta $2007			; 書いた道路は9なので野原を1キャラ多く書き込む
	lda #$03			; 右側の路肩(直進)
	jmp .writeRightEnd
.writeRightLeft
	cpx #$01			; 1(左折)か?
	bne .writeRightRight
	lda #$05			; 右側の路肩(左折)
	jmp .writeRightEnd
.writeRightRight
	lda #$07			; 右側の路肩(右折)
.writeRightEnd
	sta $2007			; $2007に書き込む

	; 右側の野原を描画
	lda #31
	sec					; sbcの前にキャリーフラグをセット
	sbc <Road_X			; 道路のX座標を引く
	sec					; sbcの前にキャリーフラグをセット
	sbc #10				; 道幅を引く
	tax
	lda #$01			; 右側の野原
.writeRightField
	sta $2007			; $2007に書き込む
	dex
	bne .writeRightField
	rts

IRQ:
	rti

	; 初期データ
X_Pos_Init   .db 120      ; X座標初期値
Y_Pos_Init   .db 200      ; Y座標初期値

	; コースデータ(10個・bit0~1=方向・bit2~7カウンタ)
	; (直進=0,左折=1,右折=2)
Course_Tbl    .db $21,$40,$32,$20,$21,$22,$20,$21,$12,$30

tilepal: .incbin "giko4.pal" ; パレットをincludeする

	.bank 2       ; バンク２
	.org $0000    ; $0000から開始

	.incbin "giko4.bkg"  ; 背景データのバイナリィファイルをincludeする
	.incbin "giko2.spr"  ; スプライトデータのバイナリィファイルをincludeする