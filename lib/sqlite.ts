import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";

type SqlValue = SQLInputValue | undefined;
type SqlParams = SqlValue | Record<string, SqlValue>;

export interface RunResult {
  lastInsertRowid: number | bigint;
  changes: number;
}

function normalizeRunResult(result: { lastInsertRowid: number | bigint; changes: number | bigint }): RunResult {
  return {
    lastInsertRowid: result.lastInsertRowid,
    changes: Number(result.changes),
  };
}

function isNamedParams(param: SQLInputValue | Record<string, SQLInputValue>): param is Record<string, SQLInputValue> {
  return Boolean(param && typeof param === "object" && !ArrayBuffer.isView(param));
}

function normalizeParam(param: SqlParams): SQLInputValue | Record<string, SQLInputValue> {
  if (param === undefined) return null;
  if (param && typeof param === "object" && !ArrayBuffer.isView(param)) {
    return Object.fromEntries(
      Object.entries(param).map(([key, value]) => [key, value ?? null])
    ) as Record<string, SQLInputValue>;
  }
  return param;
}

export class Statement {
  constructor(private readonly stmt: StatementSync) {
    this.stmt.setAllowBareNamedParameters?.(true);
  }

  all(...params: SqlParams[]): unknown[] {
    const normalized = params.map(normalizeParam);
    if (normalized.length > 0 && isNamedParams(normalized[0])) {
      return this.stmt.all(normalized[0], ...(normalized.slice(1) as SQLInputValue[]));
    }
    return this.stmt.all(...(normalized as SQLInputValue[]));
  }

  get(...params: SqlParams[]): unknown {
    const normalized = params.map(normalizeParam);
    if (normalized.length > 0 && isNamedParams(normalized[0])) {
      return this.stmt.get(normalized[0], ...(normalized.slice(1) as SQLInputValue[]));
    }
    return this.stmt.get(...(normalized as SQLInputValue[]));
  }

  run(...params: SqlParams[]): RunResult {
    const normalized = params.map(normalizeParam);
    if (normalized.length > 0 && isNamedParams(normalized[0])) {
      return normalizeRunResult(this.stmt.run(normalized[0], ...(normalized.slice(1) as SQLInputValue[])));
    }
    return normalizeRunResult(this.stmt.run(...(normalized as SQLInputValue[])));
  }
}

export class SqliteDatabase {
  private readonly db: DatabaseSync;

  constructor(path: string) {
    this.db = new DatabaseSync(path);
  }

  close(): void {
    this.db.close();
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  pragma(sql: string): unknown[] {
    return this.db.prepare(`PRAGMA ${sql}`).all();
  }

  prepare(sql: string): Statement {
    return new Statement(this.db.prepare(sql));
  }

  transaction<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult) {
    return (...args: TArgs): TResult => {
      this.exec("BEGIN");
      try {
        const result = fn(...args);
        this.exec("COMMIT");
        return result;
      } catch (err) {
        this.exec("ROLLBACK");
        throw err;
      }
    };
  }
}
