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
	.org $0000	
X_Pos   .db 0	
Y_Pos   .db 0	

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
	sta X_Pos
	lda Y_Pos_Init
	sta Y_Pos

	lda #%00011110
	sta $2001

mainLoop:		
	lda $2002  
	bpl mainLoop 

	lda #$00  
	sta $2003 

	lda Y_Pos 
	sta $2004

	lda #00   
	sta $2004 
	sta $2004 

	lda X_Pos 
	sta $2004
	
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
	dec Y_Pos	

	jmp NOTHINGdown

DOWNKEYdown:
	inc Y_Pos
	jmp NOTHINGdown

LEFTKEYdown:
	dec X_Pos
	jmp NOTHINGdown 

RIGHTKEYdown:
	inc X_Pos

NOTHINGdown:
	jmp mainLoop

	
X_Pos_Init   .db 20
Y_Pos_Init   .db 40

tilepal: .incbin "giko.pal"

	.bank 2   
	.org $0000

	.incbin "giko.bkg"
	.incbin "giko.spr"
