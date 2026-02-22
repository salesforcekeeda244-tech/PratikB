import { LightningElement, wire, track } from 'lwc';
import { gql, graphql } from 'lightning/graphql';

const COLUMNS = [
    { label: 'Name', fieldName: 'Name', type: 'text' },
    { label: 'Phone', fieldName: 'Phone', type: 'phone' },
    { label: 'Industry', fieldName: 'Industry', type: 'text' },
    { label: 'Type', fieldName: 'Type', type: 'text' },
    { label: 'Owner', fieldName: 'OwnerName', type: 'text' },
    { label: 'Created Date', fieldName: 'CreatedDate', type: 'date', typeAttributes: {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    } }
];

export default class LatestAccountTable extends LightningElement {
    columns = COLUMNS;

    @track rows = [];
    loading = true;
    error;
    get errorMessage() {
        // Normalize various error shapes from GraphQL/LDS
        if (!this.error) return undefined;
        const e = this.error;
        if (typeof e === 'string') return e;
        if (Array.isArray(e?.body)) return e.body.map(x => x?.message).filter(Boolean).join('; ');
        if (e?.body?.message) return e.body.message;
        if (e?.message) return e.message;
        try {
            return JSON.stringify(e);
        } catch {
            return 'Unknown error';
        }
    }

    get noData() {
        return !this.loading && !this.error && this.rows.length === 0;
    }

    @wire(graphql, {
        query: gql`
            query LatestAccount {
                uiapi {
                    query {
                        Account(
                            first: 1
                            orderBy: { CreatedDate: { order: DESC } }
                        ) {
                            edges {
                                node {
                                    Id
                                    Name {
                                        value
                                    }
                                    Phone {
                                        value
                                    }
                                    Industry {
                                        value
                                    }
                                    Type {
                                        value
                                    }
                                    Owner {
                                        Name {
                                            value
                                        }
                                    }
                                    CreatedDate {
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `
    })
    wiredAccounts({ data, error }) {
        this.loading = false;
        if (error) {
            this.error = error;
            this.rows = [];
            return;
        }
        if (!data) {
            this.error = { message: 'No data returned' };
            this.rows = [];
            return;
        }
        try {
            const edges = data?.uiapi?.query?.Account?.edges || [];
            const mapped = edges.map(e => {
                const n = e.node;
                return {
                    Id: n.Id,
                    Name: n.Name?.value,
                    Phone: n.Phone?.value,
                    Industry: n.Industry?.value,
                    Type: n.Type?.value,
                    OwnerName: n.Owner?.Name?.value,
                    CreatedDate: n.CreatedDate?.value
                };
            });
            this.rows = mapped;
            this.error = undefined;
        } catch (e) {
            this.error = e;
            this.rows = [];
        }
    }
}
