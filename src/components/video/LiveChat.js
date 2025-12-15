import { Users, Send, MessageCircle } from "lucide-react";

const chatMessages = [
    {
        id: 1,
        name: "Wijaya Abadi",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        message: "Duis aute irure dolor in in proident velit esse cillum dolore eu fugiat",
        isOnline: true,
    },
    {
        id: 2,
        name: "Johny Wise",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
        message: "tempor incididunt ut labore",
        isOnline: true,
    },
    {
        id: 3,
        name: "Budi Hakim",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
        message: "Duis aute irure dolor in in proident velit esse cillum dolore eu fugiat",
        isOnline: true,
    },
    {
        id: 4,
        name: "Thomas Hope",
        avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop&crop=face",
        message: "velit esse cillum dolore eu fugiat",
        isOnline: true,
    },
];

const LiveChat = () => {
    return (
        <div className="bg-card rounded-2xl p-4 h-fit">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-semibold text-lg">Live Chat</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="w-4 h-4" />
                    <span>15,986 people</span>
                </div>
            </div>

            {/* Messages */}
            <div className="space-y-4 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {chatMessages.map((chat) => (
                    <div key={chat.id} className="flex gap-3">
                        <div className="relative flex-shrink-0">
                            <img
                                src={chat.avatar}
                                alt={chat.name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            {chat.isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-foreground font-medium text-sm">{chat.name}</span>
                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed">{chat.message}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 bg-secondary rounded-full px-4 py-2.5">
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Write your message..."
                        className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground"
                    />
                </div>
                <button className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary/90 rounded-full transition-colors">
                    <Send className="w-5 h-5 text-primary-foreground" />
                </button>
            </div>
        </div>
    );
};

export default LiveChat;
