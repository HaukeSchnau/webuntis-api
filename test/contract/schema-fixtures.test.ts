import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";
import {
  AppDataSchema,
  AppExamIntegrationsSchema,
  AppPlatformApplicationMenusSchema,
  AppThirdPartyDataSchema,
  ClassregAbsencesMetaSchema,
  ClassregHomeworkListSchema,
  ClassregHomeworkMetaSchema,
  ClassregLessonTopicsMetaSchema,
  DashboardCardsDetailSchema,
  DashboardCardsSchema,
  DashboardCardsStatusSchema,
  ExamDetailSchema,
  ExamFilterSchema,
  ExamsForClassSchema,
  ExamStatisticsSchema,
  ExamsSchema,
  HomeSchema,
  MessageComposeRecipientsSchema,
  MessageDetailSchema,
  MessageDraftsSchema,
  MessageRecipientFilterSchema,
  MessageRecipientQuickfiltersSchema,
  MessageRecipientSearchSchema,
  MessageReplyFormSchema,
  MessageSentSchema,
  MessagesInboxSchema,
  MessagesPermissionsSchema,
  MessagesStatusSchema,
  MobileDataSchema,
  OnboardingSchema,
  SchoolyearSchema,
  SessionStatusSchema,
  StartupActionsSchema,
  TimeGridSchema,
  TimetableAvailableRoomsSchema,
  TimetableCalendarSchema,
  TimetableEntriesSchema,
  TimetableEntriesSettingsSchema,
  TimetableEntriesWeekOverviewSchema,
  TimetableExternalCalendarSchema,
  TimetableFilterSchema,
  TimetableGridSchema,
  TimetableMenuSchema,
  TimetableSearchSchema,
  TodayMetaSchema,
  UserContactDataSchema,
  UserEmailSchema,
} from "../../src/domains/schemas.ts";
import { strictJsonParseOptions } from "../../src/internal/schema.ts";

const dateRange = {
  start: "2026-03-16",
  end: "2026-03-20",
};

const timeRange = {
  start: "08:00",
  end: "08:45",
};

const displayResource = {
  id: 1,
  shortName: "R1",
  longName: "Room 1",
  displayName: "Room 1",
};

const teacherResource = {
  ...displayResource,
  shortName: "T1",
  longName: "Teacher 1",
  displayName: "Teacher 1",
};

const examValue = {
  examId: 1,
  examType: {
    id: 1,
    shortName: "K",
    longName: "Klausur",
    displayName: "Klausur",
    gradingScaleId: 1,
  },
  gradingScale: {
    id: 1,
    shortName: "N",
    longName: "Notes",
    displayName: "Notes",
  },
  examName: "Exam",
  examText: "Exam text",
  examStart: "2026-03-16T08:00:00",
  examEnd: "2026-03-16T09:00:00",
  examDuration: 60,
  examBooked: "2026-03-15T08:00:00",
  examBookedUser: teacherResource,
  examReturned: null,
  examReturnedUser: null,
  examModified: "2026-03-15T09:00:00",
  examModifiedUser: teacherResource,
  numStudents: 1,
  subject: displayResource,
  classes: [displayResource],
  teachers: [teacherResource],
  studentgroup: displayResource,
  students: [
    {
      id: 1,
      displayName: "Student",
      shortName: "STD",
      longName: "Student",
      gender: null,
      klasse: null,
      imageUrl: "https://example.com/image.jpg",
      gradeProtection: false,
      disadvantageCompensation: false,
    },
  ],
  invigilators: [
    {
      start: "2026-03-16T08:00:00",
      end: "2026-03-16T09:00:00",
      teachers: [teacherResource],
    },
  ],
  rooms: [displayResource],
  lessonId: 1,
  exported: false,
  deleted: false,
  isUntisExam: false,
  canEdit: true,
  canDelete: true,
  canReadGrades: true,
  canWriteGrades: false,
};

const fixtures = [
  {
    name: "AppData",
    schema: AppDataSchema,
    value: {
      currentSchoolYear: {
        id: 7,
        name: "2025/2026",
        dateRange,
        timeGrid: {
          schoolyearId: 7,
          units: [{ unitOfDay: 1, startTime: 800, endTime: 845 }],
        },
      },
      tenant: { displayName: "IGS Lilienthal", id: "tenant-42", name: "igs" },
      user: {
        id: 1,
        locale: "de",
        name: "Teacher",
        email: "teacher@example.com",
        permissions: { views: ["TIMETABLE"] },
        roles: ["STAFF"],
      },
      permissions: ["READ_MESSAGES"],
      settings: ["A"],
      holidays: [
        {
          id: 1,
          name: "Holiday",
          start: "2026-04-01",
          end: "2026-04-05",
          bookable: false,
        },
      ],
    },
  },
  {
    name: "Home",
    schema: HomeSchema,
    value: {
      schoolName: "IGS Lilienthal",
      sections: [{ cells: [{ badge: null, type: "MY_EVENTS" }] }],
      integrationsSection: [],
      isEmailUpdateRequired: false,
    },
  },
  {
    name: "MobileData",
    schema: MobileDataSchema,
    value: {
      schoolYear: { id: 7, name: "2025/2026", dateRange },
      tenant: {
        id: "tenant-42",
        displayName: "IGS Lilienthal",
        wuVersion: "2026.8.1",
        language: "de",
        schoolLoginName: "igs-lilienthal",
      },
      user: {
        id: 1,
        username: "teacher",
        person: null,
        referencedStudents: [],
        locale: "de",
        departmentId: 0,
        role: "STAFF",
        permissions: ["READ_MESSAGES"],
      },
    },
  },
  {
    name: "StartupActions",
    schema: StartupActionsSchema,
    value: { startupActions: ["VERIFY_PROFILE_DATA"] },
  },
  {
    name: "AppPlatformApplicationMenus",
    schema: AppPlatformApplicationMenusSchema,
    value: [
      {
        icon: "icon",
        id: 1,
        logoutUrl: null,
        name: "Menu",
        openInNewTab: false,
        redirectUrl: "https://example.com",
      },
    ],
  },
  {
    name: "AppThirdPartyData",
    schema: AppThirdPartyDataSchema,
    value: { playgroundUrl: null, sleekplanToken: "token" },
  },
  {
    name: "AppExamIntegrations",
    schema: AppExamIntegrationsSchema,
    value: [
      {
        active: true,
        id: 1,
        menuName: "Gradebook",
        mobileAppLink: false,
        mobileView: false,
        openInTab: true,
        role: "DEFAULT",
        url: "https://example.com/exams",
        viewType: "EXAMLIST",
      },
    ],
  },
  {
    name: "TodayMeta",
    schema: TodayMetaSchema,
    value: { greetingName: "Teacher", calendar: null },
  },
  {
    name: "DashboardCards",
    schema: DashboardCardsSchema,
    value: {
      dashboardCards: [
        {
          hasAttachments: false,
          headerColor: "ffa94d",
          icon: "megaphone",
          id: 1777,
          orderNo: 0,
          status: "UNREAD",
          subtitle: "Notice",
          title: "",
        },
      ],
    },
  },
  {
    name: "DashboardCardsDetail",
    schema: DashboardCardsDetailSchema,
    value: {
      dashboardCardsDetails: [
        {
          attachments: [],
          canDelete: false,
          canEdit: false,
          color: "ffa94d",
          content: "Notice",
          icon: "megaphone",
          id: 1777,
          status: "UNREAD",
          subtitle: "",
          title: "",
        },
      ],
    },
  },
  {
    name: "DashboardCardsStatus",
    schema: DashboardCardsStatusSchema,
    value: { unreadCardsCount: 0 },
  },
  {
    name: "Onboarding",
    schema: OnboardingSchema,
    value: { type: "TIMETABLE", time: "08:00", step: "timetable" },
  },
  {
    name: "ClassregAbsencesMeta",
    schema: ClassregAbsencesMetaSchema,
    value: {
      canEditReason: true,
      classes: [{ id: 1, name: "10A" }],
      defaultReasonId: null,
      defaultExcuseStatusId: null,
      reasons: [{ id: 1, name: "Reason", automaticNotificationEnabled: false }],
      excuseStatuses: [{ id: 1, name: "Open", type: "OPEN" }],
      assignmentGroups: [],
      filterIsActiveForMissingAbsenceParentNotification: false,
    },
  },
  {
    name: "ClassregHomeworkMeta",
    schema: ClassregHomeworkMetaSchema,
    value: {
      classes: [{ id: 1, name: "10A", nameShort: "10A" }],
      teachers: [{ id: 2, name: "TCH", nameShort: "TCH" }],
      subjects: [{ id: 3, name: "Math", nameShort: "MA" }],
      schoolYears: [{ id: 7, name: "2025/2026", dateRange, parentId: 0 }],
    },
  },
  {
    name: "ClassregHomeworkList",
    schema: ClassregHomeworkListSchema,
    value: {
      homeworkList: [
        {
          attachments: [],
          id: 222,
          createdByUser: "PER",
          lessonId: 14894,
          completed: false,
          date: "2025-08-14",
          dueDate: "2025-08-19",
          remark: "",
          subject: { id: 318, name: "sn1", nameShort: "sn1" },
          homework: "Ideen fur ein Video einsammeln.",
        },
      ],
    },
  },
  {
    name: "ClassregLessonTopicsMeta",
    schema: ClassregLessonTopicsMetaSchema,
    value: {
      teachingMethods: [],
      blockTopicAllowed: true,
      futureTopicAllowed: true,
      oneDriveAllowed: false,
    },
  },
  {
    name: "Exams",
    schema: ExamsSchema,
    value: {
      exams: [examValue],
      withDeleted: false,
    },
  },
  {
    name: "ExamsForClass",
    schema: ExamsForClassSchema,
    value: {
      examsDone: [],
      examsUpcoming: [],
      examsFuture: [],
    },
  },
  {
    name: "ExamFilter",
    schema: ExamFilterSchema,
    value: {
      examTypes: [{ id: 1, shortName: "K", longName: "Klausur", displayName: "Klausur" }],
      subjects: [displayResource],
      classes: [displayResource],
      teachers: [teacherResource],
    },
  },
  {
    name: "ExamStatistics",
    schema: ExamStatisticsSchema,
    value: {
      exams: [
        {
          exam: examValue,
          gradingScale: {
            id: 1,
            shortName: "N",
            longName: "Notes",
            displayName: "Notes",
            marks: [{ name: "A", value: 1 }],
          },
          grades: [{ id: 1, displayName: "A", weight: 1 }],
          numParticipants: 1,
          numParticipantsWithGrade: 1,
          resultSource: "MANUAL",
          averageGrade: 1,
          countPerGrade: [],
        },
      ],
    },
  },
  { name: "ExamDetail", schema: ExamDetailSchema, value: examValue },
  {
    name: "MessagesInbox",
    schema: MessagesInboxSchema,
    value: {
      incomingMessages: [
        {
          id: 1,
          subject: "Subject",
          contentPreview: null,
          sender: {
            className: null,
            displayName: "Teacher",
            imageUrl: null,
            userId: 1,
          },
          sentDateTime: "2026-03-16T08:00:00",
          allowMessageDeletion: false,
          hasAttachments: false,
          isMessageRead: true,
          isReply: false,
          isReplyAllowed: true,
        },
      ],
      readConfirmationMessages: [],
    },
  },
  {
    name: "MessageDrafts",
    schema: MessageDraftsSchema,
    value: {
      draftMessages: [
        {
          id: 1,
          subject: "Draft",
          contentPreview: null,
          hasAttachments: false,
        },
      ],
    },
  },
  {
    name: "MessagesPermissions",
    schema: MessagesPermissionsSchema,
    value: {
      recipientOptions: ["STAFF"],
      allowRequestReadConfirmation: true,
      recipientSearchMaxResult: 25,
      showDraftsTab: true,
      showSentTab: true,
      canForbidReplies: true,
      maxFileSize: 10,
      maxFileCount: 3,
    },
  },
  {
    name: "MessageRecipientQuickfilters",
    schema: MessageRecipientQuickfiltersSchema,
    value: {
      canCreatePublic: true,
      items: [
        {
          id: 1,
          name: "All",
          personCount: 1,
          deletable: false,
          editable: false,
          publicAccess: false,
          dynamic: true,
        },
      ],
    },
  },
  {
    name: "MessageRecipientFilter",
    schema: MessageRecipientFilterSchema,
    value: { filters: [{ type: "ROLE", items: ["STAFF"] }] },
  },
  {
    name: "MessageRecipientSearch",
    schema: MessageRecipientSearchSchema,
    value: [
      {
        personId: 1,
        className: null,
        displayName: "Teacher",
        imageUrl: null,
        role: "STAFF",
      },
    ],
  },
  {
    name: "MessageComposeRecipients",
    schema: MessageComposeRecipientsSchema,
    value: {
      users: [
        {
          id: 7,
          displayName: "SEI",
          imageUrl: null,
          role: "TEACHER",
          tags: [],
          className: null,
        },
      ],
    },
  },
  {
    name: "MessageSent",
    schema: MessageSentSchema,
    value: {
      sentMessages: [
        {
          id: 1,
          subject: "Sent",
          contentPreview: null,
          sentDateTime: "2026-03-16T08:00:00",
          hasAttachments: false,
        },
      ],
    },
  },
  {
    name: "MessagesStatus",
    schema: MessagesStatusSchema,
    value: { unreadMessagesCount: 0 },
  },
  {
    name: "MessageReplyForm",
    schema: MessageReplyFormSchema,
    value: {
      subject: "Re: Subject",
      recipient: { id: 1, className: null, displayName: "Teacher" },
      replyHistory: [
        {
          id: 1,
          subject: "Subject",
          content: null,
          sender: {
            className: null,
            displayName: "Teacher",
            imageUrl: null,
            userId: 1,
          },
          recipients: [],
          sentDateTime: "2026-03-16T08:00:00",
          isRevoked: false,
          attachments: [],
          blobAttachment: null,
          storageAttachments: [],
        },
      ],
    },
  },
  {
    name: "MessageDetail",
    schema: MessageDetailSchema,
    value: {
      id: 1,
      subject: "Subject",
      content: null,
      sender: {
        className: null,
        displayName: "Teacher",
        imageUrl: null,
        userId: 1,
      },
      sentDateTime: "2026-03-16T08:00:00",
      allowMessageDeletion: false,
      attachments: [],
      blobAttachment: null,
      storageAttachments: [],
      isReply: false,
      isReplyAllowed: true,
      isReportMessage: false,
      isReplyForbidden: false,
      replyHistory: [],
      requestConfirmation: null,
    },
  },
  {
    name: "UserContactData",
    schema: UserContactDataSchema,
    value: {
      email: "teacher@example.com",
      telephoneNumber: null,
      mobileNumber: null,
      street: null,
      postCode: null,
      city: null,
      areContactDetailsWriteable: true,
      userEmailMissingOrDifferentToMasterData: false,
    },
  },
  {
    name: "UserEmail",
    schema: UserEmailSchema,
    value: { email: "teacher@example.com" },
  },
  {
    name: "Schoolyears",
    schema: Schema.Array(SchoolyearSchema),
    value: [{ id: 7, name: "2025/2026", dateRange }],
  },
  {
    name: "SessionStatus",
    schema: SessionStatusSchema,
    value: { expiresInMs: 1000 },
  },
  {
    name: "TimeGrid",
    schema: TimeGridSchema,
    value: {
      schoolyearId: 7,
      units: [{ unitOfDay: 1, startTime: 800, endTime: 845 }],
    },
  },
  {
    name: "TimetableGrid",
    schema: TimetableGridSchema,
    value: {
      firstDayOfWeek: "MONDAY",
      studentFormat: 1,
      classFormat: 1,
      subjectFormat: 1,
      teacherFormat: 1,
      roomFormat: 1,
      resourceFormat: 1,
      formatDefinitions: [
        {
          id: 1,
          name: "Default",
          longname: "Default",
          showStartEndTimeOfSlots: true,
          showStartEndTime: true,
          showCancellations: true,
          showExternalCalendars: false,
          hideDetails: false,
          minRows: 6,
          duration: timeRange,
          timeGridType: "CLOCK_HOURS",
          timeGridDays: ["MONDAY"],
          timeGridSlots: [{ name: "1", number: 1, duration: timeRange }],
        },
      ],
    },
  },
  {
    name: "TimetableFilter",
    schema: TimetableFilterSchema,
    value: {
      resourceType: "ROOM",
      preSelected: null,
      buildings: [],
      departments: [
        {
          id: 1,
          shortName: "SCI",
          longName: "Science",
          displayName: "Science",
        },
      ],
      roomGroups: [],
      resourceTypes: [],
      assignmentGroups: [],
      classes: [
        {
          class: displayResource,
          classTeacher1: null,
          classTeacher2: null,
          department: null,
        },
      ],
      resources: [],
      rooms: [
        {
          room: displayResource,
          capacity: 20,
          roomGroups: [],
          building: null,
          department: null,
        },
      ],
      subjects: [
        {
          subject: displayResource,
          departments: [
            {
              id: 1,
              shortName: "SCI",
              longName: "Science",
              displayName: "Science",
            },
          ],
        },
      ],
      students: [
        {
          student: displayResource,
          classes: [
            {
              class: displayResource,
              dateRange,
              department: null,
            },
          ],
          assignmentGroups: [],
          imageUrl: null,
        },
      ],
      teachers: [
        {
          teacher: teacherResource,
          departments: [
            {
              id: 1,
              shortName: "SCI",
              longName: "Science",
              displayName: "Science",
            },
          ],
          imageUrl: null,
        },
      ],
    },
  },
  {
    name: "TimetableEntriesSettings",
    schema: TimetableEntriesSettingsSchema,
    value: {
      showSymbols: true,
      showTeacherAbsences: true,
      showStudentAbsences: false,
      showRoomLocks: false,
      showResourceLocks: false,
      showForeignSubstitutions: false,
      showICal: true,
      showICalExport: true,
      showAllDropdownElements: true,
      highlightChanges: true,
      highlightExams: true,
      highlightCancellations: true,
      highlightExternalEntries: false,
    },
  },
  {
    name: "TimetableMenu",
    schema: TimetableMenuSchema,
    value: {
      myTimetable: null,
      dependents: [],
      availableTimetables: ["STANDARD"],
    },
  },
  {
    name: "TimetableCalendar",
    schema: TimetableCalendarSchema,
    value: { integrations: [] },
  },
  {
    name: "TimetableExternalCalendar",
    schema: TimetableExternalCalendarSchema,
    value: [],
  },
  {
    name: "TimetableSearch",
    schema: TimetableSearchSchema,
    value: {
      numPartialMatches: 0,
      results: [{ type: "ROOM", resource: displayResource, imageUrl: null }],
    },
  },
  {
    name: "TimetableAvailableRooms",
    schema: TimetableAvailableRoomsSchema,
    value: [{ id: 1, name: "Room 1", longName: "Room 1", displayName: "Room 1" }],
  },
  {
    name: "TimetableEntries",
    schema: TimetableEntriesSchema,
    value: {
      format: 1,
      days: [
        {
          date: "2026-03-16",
          resourceType: "ROOM",
          resource: displayResource,
          status: "REGULAR",
          dayEntries: [],
          gridEntries: [
            {
              ids: [1],
              duration: timeRange,
              type: "NORMAL_TEACHING_PERIOD",
              status: "REGULAR",
              statusDetail: null,
              name: null,
              layoutStartPosition: 0,
              layoutWidth: 100,
              layoutGroup: 0,
              color: "#ffffff",
              notesAll: null,
              icons: ["HOMEWORK"],
              position1: [
                {
                  current: {
                    type: "SUBJECT",
                    status: "REGULAR",
                    shortName: "MA",
                    longName: "Math",
                    displayName: "Math",
                    displayNameLabel: null,
                  },
                  removed: null,
                },
              ],
              position2: null,
              position3: null,
              position4: null,
              position5: null,
              position6: null,
              position7: null,
              texts: [{ type: "LESSON_TEXT", text: "Exercise" }],
              lessonText: null,
              lessonInfo: null,
              substitutionText: null,
              userName: null,
              moved: null,
              durationTotal: null,
              link: null,
            },
          ],
          backEntries: [],
        },
      ],
      errors: [],
    },
  },
  {
    name: "TimetableEntriesWeekOverview",
    schema: TimetableEntriesWeekOverviewSchema,
    value: {
      slots: [{ name: "1", number: 1, duration: timeRange }],
      days: [
        {
          day: "2026-03-16",
          resources: [
            {
              resource: displayResource,
              status: "REGULAR",
              cells: [{ backEntries: [], gridEntries: [] }],
            },
          ],
        },
      ],
    },
  },
] as const;

describe("schema fixtures", () => {
  it.each(fixtures)("accepts valid $name fixtures", ({ schema, value }) => {
    const decode = Schema.decodeUnknownSync(schema);

    expect(() => decode(value, strictJsonParseOptions)).not.toThrow();
  });
});
