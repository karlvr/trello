const fs = require('fs')

const js = fs.readFileSync('./main.js', { encoding: 'UTF-8' })
const lines = js.split('\n')

const result = []

const paramTypes = {
    'actions': 'string | undefined',
    'boardId': 'string',
    'callbackUrl': 'string',
    'cardId': 'string',
    'checklistId': 'string',
    'color': 'string',
    'comment': 'string',
    'dateValue': 'string',
    'description': 'string',
    'extraParams': 'TrelloExtraParams',
    'field': 'string',
    'filter': 'string',
    'idModel': 'string',
    'image': 'string',
    'labelId': 'string',
    'left': 'number',
    'listId': 'string',
    'memberId': 'string',
    'name': 'string',
    'organizationId': 'string',
    'path': 'string',
    'pos': 'string',
    'query': 'TrelloExtraParams',
    'requestMethod': 'string',
    'rotate': 'number',
    'searchQuery': 'string',
    'top': 'number',
    'type': 'string',
    'url': 'string',
    'value': 'string',
    'webhookId': 'string',
    'zIndex': 'number',
}

const returnTypes = {
    'getBoard': 'Board',
    'getBoards': 'Board[]',
    'getCardsForList': 'Card[]',
    'getList': 'List',
    'getListsOnBoard': 'List[]',
    'getListsOnBoardByFilter': 'List[]',
    'getOrgBoards': 'Board[]',
    'search': 'SearchResults',
}

lines
.filter(line => line.match(/^Trello\.prototype\./))
.filter(line => !line.match(/\b(createQuery)\b/))
.forEach(line => {
    const match = line.match(/^Trello\.prototype\.(\S+)\s*=\s*function\s*\(([^\)]*)\)/)
    if (!match) {
        return undefined
    }

    const func = match[1]
    const params = match[2].split(/\s*,\s*/)

    const hasCallback = params[params.length - 1] === 'callback'
    if (hasCallback) {
        params.pop()
    }
    const hasExtraParamsOrCallback = hasCallback && params[params.length - 1] === 'extraParamsOrCallback'
    if (hasExtraParamsOrCallback) {
        params.pop()
    }

    const paramsWithTypes = params.map(param => {
        if (paramTypes[param]) {
            return `${param}: ${paramTypes[param]}`
        } else {
            console.warn(`WARN: Using 'any' type for param '${param}'`)
            return `${param}: any`
        }
    })
    const returnType = returnTypes[func] || 'any'

    if (hasCallback) {
        if (hasExtraParamsOrCallback) {
            result.push(`        ${func}(${paramsWithTypes.join(', ')}, callback: TrelloCallback<${returnType}>): void`)
            result.push(`        ${func}(${paramsWithTypes.join(', ')}, extraParams: TrelloExtraParams, callback: TrelloCallback<${returnType}>): void`)
            result.push(`        ${func}(${paramsWithTypes.join(', ')}, extraParams?: TrelloExtraParams): Promise<${returnType}>`)
        } else {
            result.push(`        ${func}(${paramsWithTypes.join(', ')}, callback: TrelloCallback<${returnType}>): void`)
            result.push(`        ${func}(${paramsWithTypes.join(', ')}): Promise<${returnType}>`)
        }
    } else {
        result.push(`        ${func}(${paramsWithTypes.join(', ')}): void`)
    }
    result.push('')
})

const header = `declare module 'trello' {

    type TrelloCallback<T> = (error: Error | null, result: T) => void
    interface TrelloExtraParams {
        [name: string]: string | number | boolean
    }

    export default class Trello {
        constructor(key: string, token: string)
`

const footer = `    }

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

    /* https://developers.trello.com/reference#list-object */
    export interface List {
        id: string
        name: string
        closed: boolean
        idBoard: string
        pos: number
        subscribed: boolean
    }

    /* https://developers.trello.com/reference#card-object */
    export interface Card {
        id: string
        badges: Badges
        checkItemStates: any[]
        closed: boolean
        dateLastActivity: string
        desc: string
        descData: any
        due?: string
        dueComplete: boolean
        idAttachmentCover?: string
        idBoard: string
        idChecklists: string[]
        idLabels: string[]
        idList: string
        idMembers: string[]
        idMembersVoted: string[]
        idShort: number
        labels: Label[]
        manualCoverAttachment: boolean
        name: string
        pos: number
        shortLink: string
        shortUrl: string
        subscribed: boolean
        url: string
        address: string
        locationName: string
        coordinates: Coordinates
    }

    export interface Badges {
        votes: number
        viewingMemberVoted: boolean
        subscribed: boolean
        fogbugz: string
        checkItems: number
        checkItemsChecked: number
        comments: number
        attachments: number
        description: boolean
        due: string | null
        dueComplete: boolean
    }

    export type Coordinates = string | { latitude: number, longitude: number }

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

    export interface SearchResults {
        options: {
            terms: string[]
            modifiers: any[]
            modelTypes: string[]
            partial: boolean
        }
        boards?: Board[]
        cards?: Card[]
    }

}
`

fs.writeFileSync('./index.d.ts', `${header}\n${result.join('\n')}${footer}`)
