import * as fs from "fs/promises";
import * as path from "path";
import {logManager} from "./bot";
import {Logger} from "./logger";

export abstract class Vault<T> {
    protected constructor(public name: string) {}

    protected logger = new Logger(logManager, "Vault_" + this.name);

    abstract get loaded(): boolean;
    protected abstract set loaded(value: boolean);

    async load(force = false): Promise<void> {
        if (this.loaded || force) return;
        await this.loadImpl();
        this.loaded = true;
    }

    protected abstract loadImpl(): Promise<void>;

    async save(): Promise<void> {
        if (!this.loaded) throw new Error("Vault is not loaded");

        await this.saveImpl();
    }

    protected abstract saveImpl(): Promise<void>;

    abstract get data(): T;
}

interface EmptyObject {}


export class JsonVault<T extends (EmptyObject extends T ? {} : never)> extends Vault<T> {
    constructor(name: string) {
        super(name);
    }

    get path() { return `vaults/${this.name}.json`; }

    private _data: T | undefined;

    private _loaded = false;
    get loaded() { return this._loaded; }
    protected set loaded(value: boolean) { this._loaded = value; }

    protected async loadImpl(): Promise<void> {
        try {
            this.logger.debug("Loading vault", this.path);
            let data = await fs.readFile(this.path, "utf8");
            this._data = JSON.parse(data);
            this.logger.debug("Loaded vault", this.path);
        } catch (e: any) {
            if (e?.code == "ENOENT") {
                this._data = {} as T;
                this.logger.debug("Created new vault", this.path);
            } else {
                throw e;
            }
        }
    }

    protected async saveImpl(): Promise<void> {
        this.logger.debug("Saving vault", this.path);
        let dirName = path.dirname(this.path);
        await fs.mkdir(dirName, {recursive: true});
        await fs.writeFile(this.path, JSON.stringify(this._data), "utf8");
        this.logger.debug("Saved vault", this.path);
    }

    get data(): T {
        if(!this.loaded) throw new Error("Vault is not loaded");

        return this._data!;
    }
}
