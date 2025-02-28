import {FragmentsHolder} from "./FragmentsHolder";

export class FragmentsHolderCache {

    private fragmentsHolderByFragmentNumber = new Map<number, FragmentsHolder>();
    private lastFoundValue?: FragmentsHolder;


    public getFromCache(fragmentNumber: number): FragmentsHolderCache {
        this.lastFoundValue = this.fragmentsHolderByFragmentNumber.has(fragmentNumber) ?
            this.fragmentsHolderByFragmentNumber.get(fragmentNumber) : undefined;
        return this;
    }

    public ifPresentThen<T>(fn: (fragmentsHolder: FragmentsHolder) => T): FragmentsHolderCache {
        return this.lastFoundValue ? fn(this.lastFoundValue) && this : this;
    }

    public orElse(fn: () => FragmentsHolder): FragmentsHolder {
        if (this.lastFoundValue) return this.lastFoundValue;
        return fn();
    }

    public delete(fragmentNumber: number): void {
        this.fragmentsHolderByFragmentNumber.delete(fragmentNumber);
    }
    public set(fragmentNumber: number, fragmentHolder: FragmentsHolder): void {
        this.fragmentsHolderByFragmentNumber.set(fragmentNumber, fragmentHolder);
    }
}