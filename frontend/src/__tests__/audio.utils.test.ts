/**
 * 音声ユーティリティ関数のテスト
 *
 * テスト対象:
 * - getAudioConstraints
 * - selectRecorderConfig
 * - getErrorMessage
 */

import {
  getAudioConstraints,
  getErrorMessage,
  selectRecorderConfig,
} from '@/utils/audio';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('音声ユーティリティ関数', () => {
  beforeEach(() => {
    // グローバルオブジェクトのモック設定
    global.window = {
      MediaRecorder: {
        isTypeSupported: vi.fn(),
      },
    } as any;
  });

  describe('getAudioConstraints', () => {
    it('正しい音声制約オブジェクトを返す', () => {
      const constraints = getAudioConstraints();

      expect(constraints).toEqual({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    });

    it('モノラル録音が設定されている', () => {
      const constraints = getAudioConstraints();
      const audio = constraints.audio as any;

      expect(audio.channelCount).toBe(1);
    });

    it('ノイズ抑制機能が有効', () => {
      const constraints = getAudioConstraints();
      const audio = constraints.audio as any;

      expect(audio.noiseSuppression).toBe(true);
      expect(audio.echoCancellation).toBe(true);
      expect(audio.autoGainControl).toBe(true);
    });
  });

  describe('selectRecorderConfig', () => {
    it('Opus対応ブラウザでOpus設定を返す', () => {
      // Opus対応をモック
      global.window.MediaRecorder.isTypeSupported = vi.fn(
        (type: string) => type === 'audio/webm;codecs=opus',
      );

      const config = selectRecorderConfig();

      expect(config).toEqual({
        ext: 'webm',
        mimeType: 'audio/webm;codecs=opus',
        contentType: 'audio/webm',
      });
    });

    it('WebM対応ブラウザでWebM設定を返す', () => {
      // WebMのみ対応をモック
      global.window.MediaRecorder.isTypeSupported = vi.fn(
        (type: string) => type === 'audio/webm',
      );

      const config = selectRecorderConfig();

      expect(config).toEqual({
        ext: 'webm',
        mimeType: 'audio/webm',
        contentType: 'audio/webm',
      });
    });

    it('非対応ブラウザでフォールバック設定を返す', () => {
      // 非対応をモック
      global.window.MediaRecorder.isTypeSupported = vi.fn(() => false);

      const config = selectRecorderConfig();

      expect(config).toEqual({
        ext: 'webm',
        contentType: 'audio/webm',
      });
      expect(config.mimeType).toBeUndefined();
    });

    it('MediaRecorder未対応環境でフォールバック設定を返す', () => {
      // MediaRecorder自体が存在しない場合
      delete (global.window as any).MediaRecorder;

      const config = selectRecorderConfig();

      expect(config.ext).toBe('webm');
      expect(config.contentType).toBe('audio/webm');
    });
  });

  describe('getErrorMessage', () => {
    it('NotAllowedError で適切なメッセージを返す', () => {
      const error = { name: 'NotAllowedError' };
      const message = getErrorMessage(error);

      expect(message).toBe(
        'マイク権限が必要です。ブラウザの設定で許可してください。',
      );
    });

    it('SecurityError で適切なメッセージを返す', () => {
      const error = { name: 'SecurityError' };
      const message = getErrorMessage(error);

      expect(message).toBe(
        'マイク権限が必要です。ブラウザの設定で許可してください。',
      );
    });

    it('NotFoundError で適切なメッセージを返す', () => {
      const error = { name: 'NotFoundError' };
      const message = getErrorMessage(error);

      expect(message).toBe(
        'マイクが見つかりません。デバイスを確認してください。',
      );
    });

    it('OverconstrainedError で適切なメッセージを返す', () => {
      const error = { name: 'OverconstrainedError' };
      const message = getErrorMessage(error);

      expect(message).toBe(
        'マイクが見つかりません。デバイスを確認してください。',
      );
    });

    it('NotReadableError で適切なメッセージを返す', () => {
      const error = { name: 'NotReadableError' };
      const message = getErrorMessage(error);

      expect(message).toBe(
        '別のアプリがマイクを使用中かもしれません。アプリを閉じて再試行してください。',
      );
    });

    it('NotSupportedError で適切なメッセージを返す', () => {
      const error = { name: 'NotSupportedError' };
      const message = getErrorMessage(error);

      expect(message).toBe(
        'このブラウザは録音に対応していません。最新のChrome/Edgeをご利用ください。',
      );
    });

    it('未知のエラーで汎用メッセージを返す', () => {
      const error = { name: 'UnknownError', message: 'Something went wrong' };
      const message = getErrorMessage(error);

      expect(message).toBe('録音エラー: Something went wrong');
    });

    it('エラーオブジェクトがnullの場合でも動作する', () => {
      const message = getErrorMessage(null);

      expect(message).toBe('録音エラー: null');
    });
  });
});
