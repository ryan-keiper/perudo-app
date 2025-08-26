import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AVAILABLE_AVATARS, updateUserProfile, calculateSuccessRates } from '@/lib/firebase-user';
import type { UserProfile } from '@/lib/firebase-user';
import { User, Trophy, Zap, Award, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { useTheme } from '@/hooks/useTheme';

interface ProfileEditorProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
}

export function ProfileEditor({ profile, isOpen, onClose, onProfileUpdate }: ProfileEditorProps) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats'>('profile');
  const { theme, setTheme } = useTheme();

  const stats = calculateSuccessRates(profile.stats);

  const handleSave = async () => {
    if (nickname.trim().length === 0) return;
    
    setIsSaving(true);
    try {
      await updateUserProfile(profile.uid, {
        nickname: nickname.trim(),
        avatar: selectedAvatar
      });
      
      onProfileUpdate({
        ...profile,
        nickname: nickname.trim(),
        avatar: selectedAvatar
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as unknown as string);
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Player Profile</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Customize your profile and view your stats
          </p>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'profile' ? 'default' : 'outline'}
            onClick={() => setActiveTab('profile')}
            className="flex-1"
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button
            variant={activeTab === 'stats' ? 'default' : 'outline'}
            onClick={() => setActiveTab('stats')}
            className="flex-1"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Statistics
          </Button>
        </div>

        {activeTab === 'profile' ? (
          <div className="space-y-6">
            {/* Current Avatar Display */}
            <div className="flex items-center justify-center">
              <div className="text-8xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl shadow-lg">
                {selectedAvatar}
              </div>
            </div>

            {/* Nickname Input */}
            <div className="space-y-2">
              <Label htmlFor="nickname">Display Name</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                maxLength={20}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                This is how other players will see you
              </p>
            </div>

            {/* Avatar Selection */}
            <div className="space-y-2">
              <Label>Choose Your Avatar</Label>
              <div className="grid grid-cols-10 gap-2 p-4 bg-secondary/20 rounded-lg max-h-64 overflow-y-auto">
                {AVAILABLE_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={cn(
                      "text-2xl p-2 rounded-lg transition-all hover:scale-110",
                      selectedAvatar === avatar
                        ? "bg-primary text-primary-foreground shadow-lg scale-110"
                        : "bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selection */}
            <div className="space-y-2">
              <Label>Theme Preference</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="gap-2"
                >
                  <Sun className="size-4" />
                  Light
                </Button>
                <Button
                  type="button"
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="gap-2"
                >
                  <Moon className="size-4" />
                  Dark
                </Button>
                <Button
                  type="button"
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className="gap-2"
                >
                  <Monitor className="size-4" />
                  System
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color theme
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || nickname.trim().length === 0}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.winRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {profile.stats.gamesWon} / {profile.stats.gamesPlayed} games
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center">
                    {profile.stats.currentWinStreak}
                    <Zap className={cn(
                      "ml-2 h-5 w-5",
                      profile.stats.currentWinStreak > 0 ? "text-yellow-500" : "text-muted-foreground"
                    )} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Best: {profile.stats.longestWinStreak}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Call Success Rates */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Dudo Success</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.dudoSuccessRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {profile.stats.successfulDudos} / {profile.stats.totalDudoCalls} calls
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Calza Success</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.calzaSuccessRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {profile.stats.successfulCalzas} / {profile.stats.totalCalzaCalls} calls
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Lifetime Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Rounds Played</span>
                  <span className="font-medium">{profile.stats.totalRoundsPlayed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Dice Rolled</span>
                  <span className="font-medium">{profile.stats.totalDiceRolled}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Win</span>
                  <span className="font-medium">{formatDate(profile.stats.lastWinDate as Timestamp | null)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-medium">{formatDate(profile.createdAt as Timestamp)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Achievements Preview (future feature) */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <Award className="mr-2 h-4 w-4" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Coming soon! Unlock achievements as you play.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}