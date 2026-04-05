import { Search } from "lucide-react"

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"

export function InputGroupDemo() {
    return (
        <InputGroup className="max-w-md h-10">
            <InputGroupInput placeholder="Search or press ctrl + k" />
            <InputGroupAddon>
                <Search />
            </InputGroupAddon>
        </InputGroup>
    )
}
