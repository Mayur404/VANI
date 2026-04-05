import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function SelectDemo() {
    return (
        <Select>
            <SelectTrigger className="w-full max-w-60 font-semibold scale-110">
                <SelectValue placeholder="Select Domain" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>DOMAIN</SelectLabel>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
