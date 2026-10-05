<?php

declare(strict_types=1);

namespace App\Support;

final class SwarmRuntime
{
    /**
     * @return array{container: string, node: string}
     */
    public static function identity(): array
    {
        $hostname = gethostname();
        $container = is_string($hostname) && $hostname !== ''
            ? $hostname
            : (string) env('HOSTNAME', 'unknown');

        // Prefer the short container id when the hostname is a long Docker id.
        if (preg_match('/^[0-9a-f]{12,64}$/i', $container) === 1) {
            $container = substr($container, 0, 12);
        }

        $node = self::resolvedEnv('NODE_HOSTNAME')
            ?? self::resolvedEnv('DOCKER_NODE_HOSTNAME')
            ?? 'unknown';

        return [
            'container' => $container,
            'node' => $node,
        ];
    }

    private static function resolvedEnv(string $key): ?string
    {
        $value = trim((string) env($key, ''));

        if ($value === '' || str_contains($value, '{{')) {
            return null;
        }

        return $value;
    }
}
