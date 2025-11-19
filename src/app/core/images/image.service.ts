import { Injectable } from '@angular/core';

export interface ImageOptions {
  size?: 'small' | 'medium' | 'large';
  usePlaceholder?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly assetsBasePath = 'assets/images/svg';

  private readonly config = {
    placeholder: {
      small: `${this.assetsBasePath}/placeholder-small.svg`,
      medium: `${this.assetsBasePath}/placeholder-medium.svg`,
      large: `${this.assetsBasePath}/placeholder-large.svg`
    },
    loading: `${this.assetsBasePath}/loading.svg`,
    error: `${this.assetsBasePath}/error.svg`
  };

  getSafeImageUrl(
    url: string | string[] | null | undefined,
    options: ImageOptions = {}
  ): string {
    const { size = 'medium', usePlaceholder = true } = options;

    // Если URL нет, возвращаем placeholder
    if (!url) {
      return usePlaceholder ? this.getPlaceholder(size) : '';
    }

    // Если URL - массив, берем первый валидный
    if (Array.isArray(url)) {
      const validUrl = url.find(u => this.isValidImageUrl(u));
      return validUrl || (usePlaceholder ? this.getPlaceholder(size) : '');
    }

    // Для одиночного URL
    const stringUrl = url as string;

    // Если это уже data URL или asset, возвращаем как есть
    if (stringUrl.startsWith('data:image') || stringUrl.startsWith('assets/')) {
      return stringUrl;
    }

    return this.isValidImageUrl(stringUrl) ? stringUrl : (usePlaceholder ? this.getPlaceholder(size) : '');
  }

  getPlaceholder(size?: 'small' | 'medium' | 'large'): string {
    if (size && this.config.placeholder[size]) {
      return this.config.placeholder[size];
    }
    return this.config.placeholder.medium;
  }

  getLoadingImage(): string {
    return this.config.loading;
  }

  getErrorImage(): string {
    return this.config.error;
  }

  private isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    const trimmedUrl = url.trim();

    // Проверяем явно невалидные значения
    if (trimmedUrl === '' ||
      trimmedUrl === 'null' ||
      trimmedUrl === 'undefined' ||
      trimmedUrl.startsWith('undefined') ||
      trimmedUrl.startsWith('null')) {
      return false;
    }

    // Data URL и assets всегда валидны
    if (trimmedUrl.startsWith('data:image') || trimmedUrl.startsWith('assets/')) {
      return true;
    }

    // Проверяем URL
    try {
      new URL(trimmedUrl);
      return true;
    } catch {
      // Относительные пути считаем валидными
      return trimmedUrl.startsWith('/') ||
        trimmedUrl.startsWith('./') ||
        trimmedUrl.startsWith('../');
    }
  }

  // Метод для проверки доступности изображения
  async checkImageAvailability(url: string): Promise<boolean> {
    if (!this.isValidImageUrl(url)) {
      return false;
    }

    // Для assets считаем, что они всегда доступны
    if (url.startsWith('assets/')) {
      return true;
    }

    // Для внешних URL делаем проверку
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      return true;
    } catch {
      return false;
    }
  }
}
