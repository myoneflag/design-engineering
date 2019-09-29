export default class UnionFind<T> {
    parent: Map<T, T> = new Map<T, T>();
    rank: Map<T, number> = new Map<T, number>();

    find(a: T): T {
        if (!this.parent.has(a)) {
            this.parent.set(a, a);
            this.rank.set(a, 0);
        }

        if (this.parent.get(a)! !== a) {
            this.parent.set(a, this.find(this.parent.get(a)!));
        }
        return this.parent.get(a)!;
    }

    join(a: T, b: T): boolean {
        a = this.find(a);
        b = this.find(b);
        if (a === b) {
            return false;
        }
        if (this.rank.get(a)! < this.rank.get(b)!) {
            this.parent.set(a, b);
        } else if (this.rank.get(b)! < this.rank.get(a)!) {
            this.parent.set(b, a);
        } else {
            this.rank.set(b, this.rank.get(b)! + 1);
            this.parent.set(a, b);
        }
        return true;
    }

    groups(): T[][] {
        const byGroup = new Map<T, T[]>();
        this.parent.forEach((g, n) => {
            if (!byGroup.has(g)) {
                byGroup.set(g, []);
            }

            byGroup.get(g)!.push(n);
        });

        return Array.from(byGroup.values());
    }
}
