---
description: 
globs: 
alwaysApply: true
---
Do not ever ask me to start the server, assume that it's running.

# Prisma
- You should use the db:migrate script from package.json, never do db push


# Dependencies
- Use lodash utils when needed
- For dates use date-fns
- For icons ALWAYS use lucide icons
- Assume framer motion, date-fns, lucuide, etc. is installed and don't try to install it again

# Tailwind
- Always use gap, never use margin.
- Try to use "horizontal" and "vertical" from [globals.css](mdc:src/styles/globals.css) instead of flex

# Components
- When you need a loading state you use [Spinner.tsx](mdc:src/components/Spinner.tsx) 
- When you need a button you use [CustomButton.tsx](mdc:src/components/CustomButton.tsx) which supports leftIcon={IconWhatever}, loading, and other extra props
- When you need to open a component in a dialog use the useDialog from [DialogManager.tsx](mdc:src/components/DialogManager.tsx)
- When you need a confirmation dialog or confirm to delete, use useConfirm() and useConfirmDelete() from [AlertContext.tsx](mdc:src/components/AlertContext.tsx)
- When you need a segmented control don't recreate it from scratch use [SegmentedControl.tsx](mdc:src/components/SegmentedControl.tsx)
- If you need to do conditional logic for desktop/mobile (outside of what tailwind is capable of with media queries) you can use const {isMobile} = useKitzeUI();

# Forms
- When doing forms, use react-hook-form. For the fields to use less boilerplate, use [FormFieldAdvancedSelect.tsx](mdc:src/components/FormFieldAdvancedSelect.tsx) [FormFieldCheckbox.tsx](mdc:src/components/FormFieldCheckbox.tsx) [FormFieldInput.tsx](mdc:src/components/FormFieldInput.tsx) [FormFieldSwitch.tsx](mdc:src/components/FormFieldSwitch.tsx) [FormFieldTextarea.tsx](mdc:src/components/FormFieldTextarea.tsx) etc. see example: [signup-schema.ts](mdc:src/schemas/signup-schema.ts)
- The onSubmit logic usually comes from outside the form. The form just declares useForm with the fields and has an on submitProp