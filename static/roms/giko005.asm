	.inesprg 1 ;
	.ineschr 1 ;
	.inesmir 0 ;
	.inesmap 0 ;

	.bank 1
	.org $FFFA

	.dw 0
	.dw Start
	.dw 0

	.bank 0
	.org $8000


Start:
	lda $2002
	bpl Start

	lda #%00001000
	sta $2000
	lda #%00000110
	sta $2001

	ldx #$00

    # set background pallet
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

	lda #$00
	sta $2003

	lda #50
	sta $2004
	lda #00
	sta $2004
	sta $2004
	lda #20
	sta $2004

	lda #%00011110
	sta $2001

infinityLoop:
	jmp infinityLoop

tilepal: .incbin "giko.pal"

	.bank 2
	.org $0000

	.incbin "giko.bkg"
	.incbin "giko.spr"
