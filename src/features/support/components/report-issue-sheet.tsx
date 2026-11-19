import { BookingSheet, SheetOption } from '@/components/booking-sheet';
import { AppView, Button, TextField } from '@/components/ui';
import type { Order } from '@/lib/api/models';

import { REPORT_ISSUES, useReportIssueForm } from '../hooks/use-report-issue-form';

export interface ReportIssueSheetProps {
  order: Order | null;
  onClose: () => void;
}

export function ReportIssueSheet({ order, onClose }: ReportIssueSheetProps) {
  const { issue, setIssue, details, setDetails, isSubmitting, submit } = useReportIssueForm(
    order,
    onClose,
  );

  return (
    <BookingSheet
      visible={order !== null}
      onClose={onClose}
      size="full"
      title="What went wrong?"
      subtitle={order ? `Trip #${order.number}` : undefined}
      footer={
        <Button
          label="Report issue"
          className="h-14"
          disabled={!issue}
          loading={isSubmitting}
          onPress={submit}
        />
      }
    >
      <AppView className="gap-2">
        {REPORT_ISSUES.map((option) => (
          <SheetOption
            key={option.category}
            label={option.label}
            icon={option.icon}
            selected={issue?.category === option.category}
            onPress={() => setIssue(option)}
          />
        ))}
      </AppView>
      <TextField
        className="mt-3"
        value={details}
        onChangeText={setDetails}
        placeholder="Tell us what happened (optional)"
        multiline
        maxLength={1000}
        inputClassName="min-h-[96px]"
        textAlignVertical="top"
        accessibilityLabel="Details"
      />
    </BookingSheet>
  );
}
