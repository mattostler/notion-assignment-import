import { SavedOptions } from './options';

interface OptionsConfiguration<T> {
	elementId: string;
	defaultValue: T;
}

type NestedKeyOf<I> = {
	[K in keyof I]: I[K] extends object ? NestedKeyOf<I[K]> | OptionsConfiguration<I[K]> : OptionsConfiguration<I[K]>;
};

const CONFIGURATION: NestedKeyOf<SavedOptions> = {
	timeZone: {
		elementId: 'timezone',
		defaultValue: 'Pacific/Auckland',
	},
	canvas: {
		classNames: {
			breadcrumbs: {
				elementId: 'breadcrumbs',
				defaultValue: 'ic-app-crumbs',
			},
			assignment: {
				elementId: 'assignment-class',
				defaultValue: 'assignment',
			},
			title: {
				elementId: 'assignment-title',
				defaultValue: 'ig-title',
			},
			availableDate: {
				elementId: 'available-date',
				defaultValue: 'assignment-date-available',
			},
			availableStatus: {
				elementId: 'available-status',
				defaultValue: 'status-description',
			},
			dueDate: {
				elementId: 'due-date',
				defaultValue: 'assignment-date-due',
			},
			dateElement: {
				elementId: 'date-element',
				defaultValue: 'screenreader-only',
			},
		},
		classValues: {
			courseCodeN: {
				elementId: 'course-code-n',
				defaultValue: '2',
			},
			notAvailable: {
				elementId: 'status-not-available',
				defaultValue: 'Not available until',
			},
		},
		courseCodeOverrides: {
			elementId: 'course-code-overrides',
			defaultValue: '{}',
		},
	},
	notion: {
		notionKey: {
			elementId: 'notion-key',
			defaultValue: null,
		},
		databaseId: {
			elementId: 'database-id',
			defaultValue: null,
		},
		propertyNames: {
			name: {
				elementId: 'notion-property-name',
				defaultValue: 'Name',
			},
			category: {
				elementId: 'notion-property-category',
				defaultValue: 'Category',
			},
			course: {
				elementId: 'notion-property-course',
				defaultValue: 'Course',
			},
			url: {
				elementId: 'notion-property-url',
				defaultValue: 'URL',
			},
			status: {
				elementId: 'notion-property-status',
				defaultValue: 'Status',
			},
			available: {
				elementId: 'notion-property-available',
				defaultValue: 'Reminder',
			},
			due: {
				elementId: 'notion-property-due',
				defaultValue: 'Due',
			},
			span: {
				elementId: 'notion-property-span',
				defaultValue: 'Date Span',
			},
		},
		propertyValues: {
			categoryCanvas: {
				elementId: 'notion-category-canvas',
				defaultValue: 'Canvas',
			},
			statusToDo: {
				elementId: 'notion-status-todo',
				defaultValue: 'To Do',
			},
		},
		courseEmojis: {
			elementId: 'course-emojis',
			defaultValue: '{}',
		},
	},
};

export = CONFIGURATION;