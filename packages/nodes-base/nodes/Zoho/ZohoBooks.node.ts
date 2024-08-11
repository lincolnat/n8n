import { IDataObject, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { IExecuteFunctions } from 'n8n-core';

import { zohoApiRequest } from './GenericFunctions';

const moment = require('moment');



export class ZohoBooks implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zoho Book',
		name: 'zohoBooks',
		icon: 'file:zohoCrm.png',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		group: ['input'],
		version: 1,
		description: 'Consume Zoho Books API.',
		defaults: {
			name: 'Zoho Books',
			color: '#CE2232',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'zohoOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Invoice',
						value: 'invoice',
					},
				],
				default: 'invoice',
				description: 'The resource to operate on.',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: [
							'invoice',
						],
					},
				},
				options: [
					{
						name: 'Get All',
						value: 'getAll',
						description: 'List all the invoices',
					},
					{
						name: 'Get an invoice',
						value: 'get',
						description: 'Get one invoice',
					},
				],
				default: 'getAll',
				description: 'The operation to perform.',
			},
			{
				displayName: 'Organization Id',
				name: 'organization_id',
				type: 'string',
				default: '',
				description: 'Organization id to get data from.',
				required: true,
			},
			{
				displayName: 'Date',
				name: 'dateOfInvoice',
				type: 'dateTime',
				default: '',
				description: 'Date of invoices which you want to retrieve.',
				displayOptions: {
					show: {
						operation: [
							'getAll',
						],
					},
				},
			},
			{
				displayName: 'Invoice Id',
				name: 'invoice_id',
				type: 'string',
				default: '',
				description: 'Invoice id which you want to get.',
				displayOptions: {
					show: {
						operation: [
							'get',
						],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let returnData: IDataObject[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const organizationId = this.getNodeParameter('organization_id', 0) as string;


		if (resource === 'invoice') {
			if (operation === 'getAll') {
				const uri = `https://books.zoho.in/api/v3/invoices`;
				let hasMore = true;
				const dateOfInvoice = this.getNodeParameter('dateOfInvoice', 0) as string;

				const qs: IDataObject = {
					organization_id: organizationId,
					date: dateOfInvoice ? moment(dateOfInvoice).format('YYYY-MM-DD') : dateOfInvoice,
					page: 1,
					per_page: 200,
				};


				while (hasMore) {
					const { invoices, page_context: { has_more_page } } = await zohoApiRequest.call(this, 'GET', '', {}, qs, uri);
					returnData = [...returnData, ...invoices];
					hasMore = has_more_page;
					if (typeof (qs.page) === 'number') {
						qs.page++;
					}
				}


			} else if (operation === 'get') {

				const invoiceId = this.getNodeParameter('invoice_id', 0) as string;

				const qs: IDataObject = {
					organization_id: organizationId,
				};

				const uri = `https://books.zoho.in/api/v3/invoices/${invoiceId}`;
				returnData = await zohoApiRequest.call(this, 'GET', '', {}, qs, uri);
			}
		}


		return [this.helpers.returnJsonArray(returnData)];
	}
}