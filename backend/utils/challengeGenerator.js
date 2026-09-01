function generateLocalChallenge({ name, description, category }) {
    const habit = String(name || "today's task").trim();
    const details = String(description || "").trim();
    const type = String(category || "").toLowerCase().trim();

    if (
        type.includes("reading") ||
        type.includes("book")
    ) {
        return `Read "${habit}" according to today's plan and write down 3 key points or ideas you understood.`;
    }

    if (
        type.includes("study") ||
        type.includes("education") ||
        type.includes("academic") ||
        type.includes("learning")
    ) {
        return `Complete today's "${habit}" study session and write down 3 important concepts you learned.`;
    }

    if (
        type.includes("gym") ||
        type.includes("fitness") ||
        type.includes("health") ||
        type.includes("workout")
    ) {
        return `Complete today's "${habit}" activity as planned and record what you completed during the session.`;
    }

    if (
        type.includes("coding") ||
        type.includes("programming") ||
        type.includes("development") ||
        type.includes("software")
    ) {
        return `Work on "${habit}" according to today's plan and complete one measurable piece of the task.`;
    }

    if (
        type.includes("dsa") ||
        type.includes("algorithm")
    ) {
        return `Complete today's "${habit}" practice and solve at least one problem related to the topic.`;
    }

    if (
        type.includes("writing") ||
        type.includes("content")
    ) {
        return `Complete today's "${habit}" task and produce one finished piece of writing as evidence of your work.`;
    }

    if (
        type.includes("meditation") ||
        type.includes("mindfulness")
    ) {
        return `Complete today's "${habit}" session without skipping it and record that you finished the planned session.`;
    }

    if (
        type.includes("language") ||
        type.includes("english")
    ) {
        return `Complete today's "${habit}" practice and write down 5 new words, phrases, or sentences you learned.`;
    }

    // General personalized challenge
    if (details) {
        return `Complete "${habit}" according to your plan: ${details}. After finishing, keep genuine proof of today's work.`;
    }

    return `Complete today's "${habit}" task as planned and keep genuine proof of the work you completed.`;
}


async function generateDailyChallenge({
    name,
    description,
    category
}) {
    /*
     * Local personalized challenge generator.
     *
     * OpenAI is intentionally not called here because
     * the current API account has no remaining credits.
     */

    return generateLocalChallenge({
        name,
        description,
        category
    });
}


module.exports = {
    generateDailyChallenge
};