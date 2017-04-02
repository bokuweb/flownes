/* @flow */

import type { Byte } from '../types/common';

export default class Apu {

  registers: Uint8Array;

  constructor() {
    // APU Registers
    // (0x4000 〜 0x4017)
    this.registers = new Uint8Array(0x18);
  }

  write(addr: Byte, data: Byte) {
    console.log('apu write', addr, data);
    if (addr === 0x00) {
      // square wave control register
    } else if (addr === 0x15) {
      this.registers[addr] = data;
    }
  }

  read(addr: Byte): Byte {
    // TODO: 
    return addr;
  }
}

/*
	this.MainClock = 1789772.5;
	this.WaveOut = true;
	this.WaveDatas = [];
	this.WaveBaseCount = 0;
	this.WaveSampleRate = 24000;
	this.WaveFrameSequence = 0;
	this.WaveFrameSequenceCounter = 0;
	this.WaveVolume = 0.5;

	this.WaveCh1LengthCounter = 0;
	this.WaveCh1Envelope = 0;
	this.WaveCh1EnvelopeCounter = 0;
	this.WaveCh1Sweep = 0;
	this.WaveCh1Frequency = 0;

	this.WaveCh2LengthCounter = 0;
	this.WaveCh2Envelope = 0;
	this.WaveCh2EnvelopeCounter = 0;
	this.WaveCh2Sweep = 0;
	this.WaveCh2Frequency = 0;

	this.WaveCh3LengthCounter = 0;
	this.WaveCh3LinearCounter = 0;

	this.WaveCh4Angle = -1;
	this.WaveCh4LengthCounter = 0;
	this.WaveCh4Envelope = 0;
	this.WaveCh4EnvelopeCounter = 0;
	this.WaveCh4Register = 0;
	this.WaveCh4BitSequence = 0;
	this.WaveCh4Angle = 0;

	this.WaveCh5Angle = -1;
	this.WaveCh5DeltaCounter = 0;
	this.WaveCh5Register = 0;
	this.WaveCh5SampleAddress = 0;
	this.WaveCh5SampleCounter = 0;

	this.ApuClockCounter = 0;

	this.WaveLengthCount = [
	0x0A, 0xFE, 0x14, 0x02, 0x28, 0x04, 0x50, 0x06,
	0xA0, 0x08, 0x3C, 0x0A, 0x0E, 0x0C, 0x1A, 0x0E,
	0x0C, 0x10, 0x18, 0x12, 0x30, 0x14, 0x60, 0x16,
	0xC0, 0x18, 0x48, 0x1A, 0x10, 0x1C, 0x20, 0x1E];

	this.WaveCh1_2DutyData = [4, 8, 16, 24];

	this.WaveCh3SequenceData = [
	  15,  13,  11,  9,   7,   5,   3,   1,
	  -1,  -3,  -5, -7,  -9, -11, -13, -15,
	 -15, -13, -11, -9,  -7,  -5,  -3,  -1,
	   1,   3,   5,  7,   9,  11,  13,  15];

	this.WaveCh4FrequencyData = [
	0x004, 0x008, 0x010, 0x020,
	0x040, 0x060, 0x080, 0x0A0,
	0x0CA, 0x0FE, 0x17C, 0x1FC,
	0x2FA, 0x3F8, 0x7F2, 0xFE4];

	this.WaveCh5FrequencyData = [
	0x1AC, 0x17C, 0x154, 0x140,
	0x11E, 0x0FE, 0x0E2, 0x0D6,
	0x0BE, 0x0A0, 0x08E, 0x080,
	0x06A, 0x054, 0x048, 0x036];

	this.WebAudioCtx = null;
	this.WebAudioJsNode = null;
	this.WebAudioGainNode = null;
	this.WebAudioBufferSize = 4096;

	this.ApuCpuClockCounter = 0;

	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	this.canAudioContext = typeof window.AudioContext !== "undefined";

	if(this.canAudioContext) {
		this.WebAudioCtx = new window.AudioContext();
		this.WebAudioJsNode = this.WebAudioCtx.createScriptProcessor(this.WebAudioBufferSize, 1, 1);
		this.WebAudioJsNode.onaudioprocess = this.WebAudioFunction.bind(this);
		this.WebAudioGainNode = this.WebAudioCtx.createGain();
		this.WebAudioJsNode.connect(this.WebAudioGainNode);
		this.WebAudioGainNode.connect(this.WebAudioCtx.destination);
		this.WaveSampleRate = this.WebAudioCtx.sampleRate;
	}


	this.FDS_WAVE_REG = new Array(0x40);
	this.FDS_LFO_REG = new Array(0x20);
	this.FDS_REG = new Array(0x10);
	this.FDS_LFO_DATA = [0, 1, 2, 4, 0, -4, -2, -1];
	//this.FDS_LFO_DATA = [0, 1, 2, 3, -4, -3, -2, -1];//<--

	this.FDS_WaveIndexCounter = 0;
	this.FDS_WaveIndex = 0;

	this.FDS_LFOIndexCounter = 0;
	this.FDS_LFOIndex = 0;
	this.FDS_REGAddress = 0;

	this.FDS_VolumeEnvCounter = 0;
	this.FDS_VolumeEnv = 0;

	this.FDS_SweepEnvCounter = 0;
	this.FDS_SweepEnv = 0;
	this.FDS_SweepBias = 0;

	this.FDS_Volume = 0;

	this.MMC5_FrameSequenceCounter = 0;
	this.MMC5_FrameSequence = 0;
	this.MMC5_REG = new Array(0x20);
	this.MMC5_Ch = new Array(2);
	this.MMC5_Level = 0;

	this.VRC6_REG = new Array(12);
	this.VRC6_Ch3_Counter = 0;
	this.VRC6_Ch3_index = 0;
	this.VRC6_Level = 0;

	this.N163_ch_data = new Array(8);
	this.N163_RAM = new Array(128);
	this.N163_Address = 0x00;
	this.N163_ch = 0;
	this.N163_Level = 0;
	this.N163_Clock = 0;

	this.AY_ClockCounter = 0;
	this.AY_REG = new Array(16);
	this.AY_Noise_Seed = 0x0001;
	this.AY_Noise_Angle = 0;
	this.AY_Env_Counter = 0;
	this.AY_Env_Index = 0;
	this.AY_REG_Select = 0x00;
	this.AY_Level = 0;

	this.AY_Env_Pattern = [
	[15,14,13,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[15,14,13,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[15,14,13,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[15,14,13,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[15,14,13,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
	 15,14,13,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
	 15,14,13,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
	[15,14,13,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[15,14,13,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
	  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,
	 15,14,13,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
	[15,14,13,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
	 15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,
	 15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
	[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,
	  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,
	  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15],
	[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,
	 15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,
	 15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
	[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,
	 15,14,13,12,11,10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
	  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15],
	[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

	this.AY_Env_Volume = [    0,   16,   23,   32,
				 45,   64,   90,  128,
				181,  256,  362,  512,
				724, 1023, 1447, 2047];
};
				this.IO2[address & 0x00FF] = data;
				switch (address) {
					case 0x4000: // 矩形波制御レジスタ #1
					case 0x4001: // 矩形波制御レジスタ #2
					case 0x4002: // 矩形波周波数値レジスタ #1
						this.WriteCh1Length0();
						return;
					case 0x4003: // 矩形波周波数値レジスタ #2
						this.WriteCh1Length1();
						return;
					case 0x4004: // 矩形波制御レジスタ #1
					case 0x4005: // 矩形波制御レジスタ #2
					case 0x4006: // 矩形波周波数値レジスタ #1
						this.WriteCh2Length0();
						return;
					case 0x4007: // 矩形波周波数値レジスタ #2
						this.WriteCh2Length1();
						return;
					case 0x4008: // 三角波制御レジスタ #1
						this.WriteCh3LinearCounter();
						return;
					case 0x4009: // 三角波制御レジスタ #2
					case 0x4010: // PCM 制御レジスタ #1
					case 0x400A: // 三角波周波数値レジスタ #1
					case 0x400B: // 三角波周波数値レジスタ #2
						this.WriteCh3Length1();
						return;
					case 0x400C: // ノイズ制御レジスタ #1
					case 0x400D: // ノイズ制御レジスタ #2
					case 0x400E: // 周波数値レジスタ #1
					case 0x400F: // 周波数値レジスタ #2
						this.WriteCh4Length1();
						return;
					case 0x4010: // PCM 制御レジスタ #1
						this.WriteCh5DeltaControl();
						return;
					case 0x4011: // PCM 音量制御レジスタ
						this.WriteCh5DeltaCounter();
						return;
					case 0x4012: // PCM アドレスレジスタ
					case 0x4013: // PCM データ長レジスタ
					case 0x4014: // SPRDMA (W) スプライト DMA
						// PPU OAMDMA
						this.StartDMA(data);
						return;
					case 0x4015: // SNDCNT (RW) サウンド制御レジスタ
						this.WriteWaveControl();
						return;
					case 0x4016:
						// PAD I/O Register(1P)
						this.WriteJoyPadRegister1(data);
						return;
					case 0x4017:
						// PAD I/O Register(2P)
						return;
					case 0x4018:
					case 0x4019:
					case 0x401A:
					case 0x401B:
					case 0x401C:
					case 0x401D:
					case 0x401E:
					case 0x401F:
*/