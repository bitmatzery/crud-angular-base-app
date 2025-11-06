// log.service.ts
import { Injectable } from '@angular/core';

export interface AccessAttemptLog {
  userId: number;
  email: string | null;
  targetUrl: string;
  timestamp: Date;
  userRole: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private readonly MAX_LOGS = 100;
  private accessLogs: AccessAttemptLog[] = [];

  logAccessAttempt(log: AccessAttemptLog): void {
    this.accessLogs.unshift(log);

    if (this.accessLogs.length > this.MAX_LOGS) {
      this.accessLogs = this.accessLogs.slice(0, this.MAX_LOGS);
    }

    // Форматированный вывод в консоль
    console.warn(
      `Access attempt: ${log.email || 'Guest'} (${log.userRole}) tried to access ${log.targetUrl} at ${log.timestamp.toLocaleTimeString()}`
    );
  }

  getLogs(): AccessAttemptLog[] {
    return this.accessLogs.map(log => ({
      ...log,
      email: log.email || 'Guest'
    }));
  }

  // Метод для форматированного вывода логов
  printLogs(): void {
    if (this.accessLogs.length === 0) {
      console.log('No access logs available');
      return;
    }

    console.group('Access Logs:');
    this.accessLogs.forEach(log => {
      console.log(
        `%c${new Date(log.timestamp).toLocaleString()}%c ${log.email || 'Guest'} %c(${log.userRole})%c → ${log.targetUrl}`,
        'color: #888',
        'color: #00f; font-weight: bold',
        'color: #080',
        'color: #000'
      );
    });
    console.groupEnd();
  }
}
