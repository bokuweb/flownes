	.inesprg 1
	.ineschr 1
	.inesmir 0
	.inesmap 0

	.bank 1   
	.org $FFFA

	.dw 0     
	.dw Start 
	.dw 0     

	.bank 0	
	.org $0300	
Sprite1_Y:     .db  0
Sprite1_T:     .db  0
Sprite1_S:     .db  0
Sprite1_X:     .db  0
Sprite2_Y:     .db  0
Sprite2_T:     .db  0
Sprite2_S:     .db  0
Sprite2_X:     .db  0

	.org $8000	
Start:
	lda $2002 
	bpl Start 

	lda #%00001000
	sta $2000
	lda #%00000110
	sta $2001

	ldx #$00

	lda #$3F  
	sta $2006 
	lda #$00  
	sta $2006

loadPal:	
	lda tilepal, x

	sta $2007

	inx

	cpx #32
	bne loadPal

	lda X_Pos_Init
	sta Sprite1_X
	lda Y_Pos_Init
	sta Sprite1_Y

	lda X_Pos_Init
	adc #7
	sta Sprite2_X
	lda Y_Pos_Init
	sta Sprite2_Y
	lda #%01000000
	sta Sprite2_S

	lda #%00011110
	sta $2001

mainLoop:		
	lda $2002
	bpl mainLoop

	lda #$3
	sta $4014
	
	lda #$01
	sta $4016
	lda #$00 
	sta $4016

	lda $4016
	lda $4016
	lda $4016
	lda $4016
	lda $4016
	and #1   
	bne UPKEYdown
	
	lda $4016
	and #1   
	bne DOWNKEYdown

	lda $4016
	and #1   
	bne LEFTKEYdown

	lda $4016
	and #1   
	bne RIGHTKEYdown
	jmp NOTHINGdown 

UPKEYdown:
	dec Sprite1_Y	
	jmp NOTHINGdown

DOWNKEYdown:
	inc Sprite1_Y
	jmp NOTHINGdown

LEFTKEYdown:
	dec Sprite1_X
	jmp NOTHINGdown 

RIGHTKEYdown:
	inc Sprite1_X

NOTHINGdown:
	lda Sprite1_X
	adc #8
	sta Sprite2_X
	lda Sprite1_Y
	sta Sprite2_Y

	jmp mainLoop

X_Pos_Init   .db 20
Y_Pos_Init   .db 40

tilepal: .incbin "giko2.pal"

	.bank 2    
	.org $0000 

	.incbin "giko.bkg" 
	.incbin "giko2.spr"
