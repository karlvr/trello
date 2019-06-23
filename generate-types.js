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
    'getMemberCards': 'Card[]',
    'getOrgBoards': 'Board[]',
    'search': 'SearchResults',
}

const extraParamsTypes = {
    'getBoard': 'GetBoardQueryParams',
    'getListsOnBoard': 'GetBoardListsQueryParams',
    'getMemberCards': 'GetMemberCardsQueryParams',
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
            const extraParamsType = extraParamsTypes[func] || 'TrelloExtraParams'
            result.push(`        ${func}(${paramsWithTypes.join(', ')}, callback: TrelloCallback<${returnType}>): void`)
            result.push(`        ${func}(${paramsWithTypes.join(', ')}, extraParams: ${extraParamsType}, callback: TrelloCallback<${returnType}>): void`)
            result.push(`        ${func}(${paramsWithTypes.join(', ')}, extraParams?: ${extraParamsType}): Promise<${returnType}>`)
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

    interface NestedActionQueryParams {
        actions_entities?: boolean
        actions_display?: boolean
        actions_format?: 'count' | 'list' | 'minimal'
        actions_since?: string
        actions_limit?: number
        action_fields?: string
        action_member?: boolean
        action_member_fields?: string
        action_memberCreator?: boolean
        action_memberCreator_fields?: string
    }

    interface NestedCardQueryParams {
        cards?: 'all' | 'closed' | 'none' | 'open' | 'visible'
        card_fields?: string
        card_members?: boolean
        card_member_fields?: string
        card_attachments?: true | false | 'cover'
        card_attachment_fields?: string
        card_stickers?: boolean
        cards_modifiedSince?: string
        card_customFieldItems?: boolean
    }

    interface NestedChecklistQueryParams {
        checklists?: 'all' | 'none'
        checklist_fields?: string
        checkItems?: string
        checkItem_fields?: string
    }

    interface NestedCustomFieldsQueryParams {
        customFields?: boolean
    }

    interface NestedLabelsQueryParams {
        labels?: 'all' | 'none'
        label_fields?: string
        labels_limit?: number
    }

    interface NestedListsQueryParams {
        lists?: 'all' | 'closed' | 'none' | 'open'
        list_fields?: string
    }

    interface NestedMembersQueryParams {
        members?: 'none' | 'normal' | 'admins' | 'owners' | 'all'
        member_fields?: string
    }

    interface NestedMembershipsQueryParams {
        memberships?: 'all' | 'none'
    }

    interface NestedOrganizationQueryParams {
        organization?: boolean
    }

    interface GetBoardQueryParams extends NestedActionQueryParams, NestedCardQueryParams, NestedChecklistQueryParams, NestedCustomFieldsQueryParams, NestedLabelsQueryParams, NestedListsQueryParams, NestedMembersQueryParams, NestedMembershipsQueryParams, NestedOrganizationQueryParams {
        boardStars?: 'mine' | 'none'
        card_pluginData?: boolean
        fields?: string
        membersInvited?: 'admins' | 'all' | 'none' | 'normal' | 'owners'
        membersInvited_fields?: string
        pluginData?: boolean
        organization_pluginData?: boolean
        myPrefs?: boolean
        tags?: boolean
    }

    interface GetBoardListsQueryParams extends NestedCardQueryParams {
        filter?: 'all' | 'closed' | 'none' | 'open'
        fields?: string
    }

    interface GetMemberCardsQueryParams {
        filter?: 'all' | 'closed' | 'none' | 'open' | 'visible'
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

        cards?: Card[]
        labels?: Label[]
        lists?: List[]
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
