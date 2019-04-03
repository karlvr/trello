declare module 'trello' {

	type TrelloCallback<T> = (error: Error | null, result: T) => void

	export default class Trello {
		constructor(key: string, token: string)

		makeRequest<T>(requestMethod: string, path: string, options: any | undefined, callback: TrelloCallback<T>): void
		makeRequest<T>(requestMethod: string, path: string, options?: any): Promise<T>

		addBoard(name: string, description: string, organizationId: string, callback: TrelloCallback<any>): void
		addBoard(name: string, description: string, organizationId: string): Promise<any>

		updateBoardPref(boardId: string, field: string, value: string, callback: TrelloCallback<any>): void
		updateBoardPref(boardId: string, field: string, value: string): Promise<any>

		addCard(name: string, description: string, listId: string, callback: TrelloCallback<any>): void
		addCard(name: string, description: string, listId: string): Promise<any>

		getBoards(memberId: string, callback: TrelloCallback<Board[]>): void
		getBoards(memberId: string): Promise<Board[]>
	}

	/** https://developers.trello.com/v1.0/reference#board-object  */
	export interface Board {
		id: string
		name: string
		desc: string
		descData: string | null
		closed: boolean
		idOrganisation: string
		pinned: boolean
		url: string
		shortUrl: string
		prefs: any
		labelNames: {
			[color: string]: string
		}
		starred: boolean
		limits: any
		memberships: Membership[]
	}

	export interface Label {
		id: string
		name: string
		color: string
	}

	export interface Membership {
		id: string
		idMember: string
		memberType: string
		unconfirmed: boolean
	}

}
